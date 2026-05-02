import json
from typing import Any
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq

from agents.base_agent import BaseAgent
from tools.chem_tools import validate_smiles, canonicalize_smiles
from config import GROQ_API_KEY, GROQ_MODEL_GENERATE, MAX_NOVEL_CANDIDATES


DESIGNER_SYSTEM_PROMPT = """You are an expert in computational catalysis and materials design.
Generate novel catalyst candidates as SMILES strings for a target reaction.

Rules:
1. Generate diverse candidates spanning different metal centers and supports.
2. Prefer earth-abundant metals (Fe, Ni, Co, Cu, Mn, Mo) for sustainability.
3. Consider promoters (K, Na, La, Ce) and their electronic effects.
4. Each SMILES must be chemically plausible (metals in brackets: [Fe], [Ni], etc).
5. Vary coordination environments: monometallic, bimetallic, promoted.

You MUST respond with ONLY a valid JSON object, no other text, no markdown:
{"candidates":[{"name":"Metal/Support","smiles":"SMILES","rationale":"reason","metal_type":"symbol","support_material":"formula"}]}"""


class DesignerAgent(BaseAgent):
    """
    Designer Agent (⚗️)
    Uses Groq (llama3-70b) with explicit JSON-only prompting to generate novel catalyst SMILES.
    Validates each SMILES with RDKit before passing downstream.
    """

    name = "Designer"
    description = "Generates novel catalyst candidates using generative AI."

    def __init__(self):
        super().__init__()
        # Higher temperature for generative diversity
        self.llm = self._init_llm(temperature=0.7, model=GROQ_MODEL_GENERATE)

    def _build_generation_prompt(
        self,
        reaction: str,
        known_smiles: list[str],
        literature_context: str,
    ) -> str:
        known_str = "\n".join(known_smiles[:8]) if known_smiles else "None"
        lit_str = literature_context[:800] if literature_context else "No context available."
        return (
            f"Target reaction: {reaction}\n\n"
            f"Known catalyst SMILES (do not duplicate):\n{known_str}\n\n"
            f"Relevant literature:\n{lit_str}\n\n"
            f"Generate exactly {MAX_NOVEL_CANDIDATES} novel catalyst candidates. "
            f"Return ONLY the JSON object."
        )

    def _parse_and_validate(self, raw: str) -> list[dict]:
        # Strip any accidental markdown fences
        cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        try:
            parsed = json.loads(cleaned)
            candidates = parsed.get("candidates", [])
        except json.JSONDecodeError:
            # Attempt to extract JSON object if model added preamble
            start = cleaned.find("{")
            end = cleaned.rfind("}") + 1
            if start == -1 or end == 0:
                return []
            try:
                parsed = json.loads(cleaned[start:end])
                candidates = parsed.get("candidates", [])
            except json.JSONDecodeError:
                return []

        valid = []
        for c in candidates:
            smiles = c.get("smiles", "")
            canonical = canonicalize_smiles(smiles)
            if canonical and validate_smiles(canonical):
                c["smiles"] = canonical
                c["type"] = "novel"
                c["source_db"] = "AI Generated"
                valid.append(c)
        return valid

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        self.set_status("working", "Generating novel SMILES candidates...")

        reaction = context["reaction"]
        known_candidates = context.get("known_candidates", [])
        literature_context = context.get("literature_context", "")
        known_smiles = [c.get("smiles", "") for c in known_candidates if c.get("smiles")]

        messages = [
            SystemMessage(content=DESIGNER_SYSTEM_PROMPT),
            HumanMessage(content=self._build_generation_prompt(
                reaction, known_smiles, literature_context
            )),
        ]

        raw_output = await self.invoke_llm(messages)
        novel_candidates = self._parse_and_validate(raw_output)

        self.set_status("complete", f"Generated {len(novel_candidates)} validated candidates")

        return {
            **context,
            "novel_candidates": novel_candidates,
            "all_candidates": known_candidates + novel_candidates,
            "designer_log": (
                f"Generated {len(novel_candidates)}/{MAX_NOVEL_CANDIDATES} valid novel candidates"
            ),
        }
