import json
from typing import Any
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI

from agents.base_agent import BaseAgent
from tools.chem_tools import validate_smiles, canonicalize_smiles
from config import OPENAI_API_KEY, OPENAI_MODEL, MAX_NOVEL_CANDIDATES


DESIGNER_SYSTEM_PROMPT = """You are an expert in computational catalysis and materials design.
Your task is to generate novel catalyst candidates as SMILES strings for a target reaction.

Rules for generation:
1. Generate diverse candidates spanning different metal centers and support materials.
2. Prefer earth-abundant metals (Fe, Ni, Co, Cu, Mn, Mo) for sustainability scoring.
3. Consider known promoters (K, Na, La, Ce) and their electronic effects.
4. Each SMILES must be chemically valid.
5. Vary coordination environments: single-atom, nanoparticle, intermetallic.

Return ONLY a JSON object matching this schema:
{
  "candidates": [
    {
      "name": "Metal/Support-Modifier",
      "smiles": "SMILES_STRING",
      "rationale": "Why this catalyst is promising for the reaction",
      "metal_type": "primary metal symbol",
      "support_material": "support formula"
    }
  ]
}"""


class DesignerAgent(BaseAgent):
    """
    Designer Agent (⚗️)
    Uses GPT-4o with structured output to generate novel catalyst SMILES.
    Falls back to Groq if OpenAI quota exceeded.
    Validates each generated SMILES via RDKit before passing downstream.
    """

    name = "Designer"
    description = "Generates novel catalyst candidates using generative AI."

    def __init__(self):
        super().__init__(use_groq=False)
        # Designer uses GPT-4o for higher quality generation
        self.llm = ChatOpenAI(
            api_key=OPENAI_API_KEY,
            model=OPENAI_MODEL,
            temperature=0.7,
            max_tokens=3000,
            response_format={"type": "json_object"},
        )

    def _build_generation_prompt(
        self,
        reaction: str,
        known_smiles: list[str],
        literature_context: str,
    ) -> str:
        return (
            f"Target reaction: {reaction}\n\n"
            f"Known catalyst SMILES (avoid duplicates):\n{chr(10).join(known_smiles)}\n\n"
            f"Relevant literature context:\n{literature_context}\n\n"
            f"Generate exactly {MAX_NOVEL_CANDIDATES} novel catalyst candidates "
            f"that are chemically distinct from the known ones."
        )

    def _parse_and_validate(self, raw_json: str) -> list[dict]:
        """Parse LLM JSON output and validate each SMILES with RDKit."""
        try:
            parsed = json.loads(raw_json)
            candidates = parsed.get("candidates", [])
        except json.JSONDecodeError:
            return []

        valid_candidates = []
        for c in candidates:
            smiles = c.get("smiles", "")
            canonical = canonicalize_smiles(smiles)
            if canonical and validate_smiles(canonical):
                c["smiles"] = canonical
                c["type"] = "novel"
                c["source_db"] = "AI Generated"
                valid_candidates.append(c)

        return valid_candidates

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

        # If generation fails validation, fall back to Groq with simpler prompt
        if not novel_candidates:
            self.set_status("working", "Retrying with fallback model...")
            self.llm = self._init_llm(use_groq=True)
            raw_output = await self.invoke_llm(messages)
            novel_candidates = self._parse_and_validate(raw_output)

        self.set_status("complete", f"Generated {len(novel_candidates)} validated candidates")

        return {
            **context,
            "novel_candidates": novel_candidates,
            "all_candidates": known_candidates + novel_candidates,
            "designer_log": (
                f"Generated {len(novel_candidates)}/{MAX_NOVEL_CANDIDATES} "
                f"valid novel candidates"
            ),
        }
