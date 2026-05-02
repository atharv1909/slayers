import json
from typing import Any
from langchain_core.messages import SystemMessage, HumanMessage

from agents.base_agent import BaseAgent
from config import ACTIVITY_WEIGHT, SELECTIVITY_WEIGHT, STABILITY_WEIGHT


SAGE_SYSTEM_PROMPT = """You are a senior principal scientist in heterogeneous catalysis and sustainable fuels.
You have just received prediction results from an AI screening campaign.
Your role is to:
1. Identify the most promising candidate and explain WHY (d-band center, BEP relations, geometric effects)
2. Flag any concerning patterns (e.g., activity/selectivity trade-offs, sintering risk)
3. Recommend the top 3 follow-up experiments
4. Estimate the probability of experimental success for the top candidate
5. Note any carbon impact advantages

Be technical, concise, and reference specific mechanistic concepts.
Return JSON: {
  "top_candidate_name": str,
  "top_candidate_rationale": str,
  "concerning_patterns": [str],
  "recommended_experiments": [str],
  "success_probability": float,
  "carbon_impact_note": str,
  "full_summary": str
}"""


class SageAgent(BaseAgent):
    """
    Sage Agent (🧠)
    Synthesizes all upstream outputs into a ranked list + narrative insight report.
    Uses GPT-4o for nuanced mechanistic reasoning on the final synthesis step.
    """

    name = "Sage"
    description = "Synthesizes predictions into ranked candidates and scientific insights."

    def _rank_candidates(self, candidates: list[dict]) -> list[dict]:
        def score(c: dict) -> float:
            a = c.get("predicted_activity", 0.0)
            s = c.get("predicted_selectivity", 0.0) / 100.0
            stab = min(c.get("predicted_stability", 0.0) / 1000.0, 1.0)
            return ACTIVITY_WEIGHT * a + SELECTIVITY_WEIGHT * s + STABILITY_WEIGHT * stab

        return sorted(candidates, key=score, reverse=True)

    def _build_summary_table(self, ranked: list[dict]) -> str:
        rows = []
        for i, c in enumerate(ranked[:10]):
            rows.append(
                f"{i+1}. {c['name']} | "
                f"Activity={c.get('predicted_activity', 'N/A'):.3f} | "
                f"Selectivity={c.get('predicted_selectivity', 'N/A'):.1f}% | "
                f"Stability={c.get('predicted_stability', 'N/A'):.0f}h | "
                f"Type={c.get('type', 'known')}"
            )
        return "\n".join(rows)

    async def _generate_insight_report(
        self,
        reaction: str,
        top_candidates_table: str,
        literature_context: str,
    ) -> dict:
        messages = [
            SystemMessage(content=SAGE_SYSTEM_PROMPT),
            HumanMessage(content=(
                f"Target reaction: {reaction}\n\n"
                f"Top 10 candidates (ranked by weighted score):\n{top_candidates_table}\n\n"
                f"Literature context:\n{literature_context}"
            )),
        ]
        raw = await self.invoke_llm(messages)
        try:
            cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            start = cleaned.find("{")
            end = cleaned.rfind("}") + 1
            return json.loads(cleaned[start:end]) if start != -1 else {
                "top_candidate_name": "",
                "full_summary": cleaned,
                "concerning_patterns": [],
                "recommended_experiments": [],
                "success_probability": 0.6,
                "carbon_impact_note": "",
                "top_candidate_rationale": cleaned,
            }
        except json.JSONDecodeError:
            return {
                "top_candidate_name": "",
                "top_candidate_rationale": raw,
                "concerning_patterns": [],
                "recommended_experiments": [],
                "success_probability": 0.6,
                "carbon_impact_note": "",
                "full_summary": raw,
            }

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        self.set_status("working", "Synthesizing insights and ranking candidates...")

        predicted_candidates = context.get("predicted_candidates", [])
        reaction = context["reaction"]
        literature_context = context.get("literature_context", "")

        ranked = self._rank_candidates(predicted_candidates)
        summary_table = self._build_summary_table(ranked)
        insight = await self._generate_insight_report(reaction, summary_table, literature_context)

        self.set_status("complete", f"Ranked {len(ranked)} candidates. Top: {ranked[0]['name'] if ranked else 'N/A'}")

        return {
            **context,
            "ranked_candidates": ranked,
            "insight_report": insight,
            "top_candidate": ranked[0] if ranked else None,
            "sage_log": f"Top candidate: {insight.get('top_candidate_name', 'Unknown')} — {insight.get('full_summary', '')[:120]}...",
        }
