import math
import hashlib
import random
from typing import Any
from langchain_core.messages import SystemMessage, HumanMessage

from agents.base_agent import BaseAgent
from tools.prediction_tools import (
    predict_activity_heuristic,
    predict_selectivity_heuristic,
    predict_stability_heuristic,
    estimate_uncertainty,
)
from config import ACTIVITY_WEIGHT, SELECTIVITY_WEIGHT, STABILITY_WEIGHT, PREDICTION_UNCERTAINTY_THRESHOLD


ORACLE_SYSTEM_PROMPT = """You are a surrogate model interpreter for heterogeneous catalysis.
Given a catalyst SMILES and target reaction, analyze:
1. Expected activity based on d-band theory and Brønsted-Evans-Polanyi (BEP) relations
2. Selectivity based on geometric and electronic effects
3. Stability based on metal-support interaction strength

Flag uncertainty when:
- Novel metal combinations with no literature precedent
- Extreme operating conditions outside training distribution
- SMILES complexity suggesting unusual coordination

Return ONLY a JSON object, no other text:
{"activity_adjustment": 0.0, "selectivity_adjustment": 0.0, "uncertainty_flags": [], "mechanistic_note": ""}"""


class OracleAgent(BaseAgent):
    """
    Oracle Agent (🔮)
    Combines heuristic property prediction with LLM-guided mechanistic reasoning.
    Produces predicted_activity, predicted_selectivity, predicted_stability,
    predicted_confidence, and a weighted composite score for ranking.
    """

    name = "Oracle"
    description = "Predicts catalyst performance properties using surrogate models."

    # LLM adjustment only called when uncertainty is high (>threshold) for any candidate type
    LLM_CALL_CONFIDENCE_THRESHOLD = 0.70

    def _deterministic_seed(self, smiles: str) -> float:
        """Derive a deterministic noise seed from SMILES so predictions are reproducible."""
        h = int(hashlib.md5(smiles.encode()).hexdigest(), 16)
        return (h % 1000) / 1000.0

    def _compute_score(self, activity: float, selectivity: float, stability: float) -> float:
        norm_stability = min(stability / 1000.0, 1.0)
        return (
            ACTIVITY_WEIGHT * activity
            + SELECTIVITY_WEIGHT * (selectivity / 100.0)
            + STABILITY_WEIGHT * norm_stability
        )

    async def _get_llm_adjustment(self, smiles: str, reaction: str) -> dict:
        messages = [
            SystemMessage(content=ORACLE_SYSTEM_PROMPT),
            HumanMessage(content=f"Catalyst SMILES: {smiles}\nReaction: {reaction}"),
        ]
        try:
            import json
            raw = await self.invoke_llm(messages)
            cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            start = cleaned.find("{")
            end = cleaned.rfind("}") + 1
            return json.loads(cleaned[start:end]) if start != -1 else {}
        except Exception:
            return {
                "activity_adjustment": 0.0,
                "selectivity_adjustment": 0.0,
                "uncertainty_flags": [],
                "mechanistic_note": "",
            }

    async def _predict_candidate(self, candidate: dict, reaction: str) -> dict:
        smiles = candidate.get("smiles", "")
        seed = self._deterministic_seed(smiles)

        base_activity = predict_activity_heuristic(smiles, seed)
        base_selectivity = predict_selectivity_heuristic(smiles, seed)
        base_stability = predict_stability_heuristic(smiles, seed)

        # Compute confidence first — used to decide whether to call LLM
        confidence = estimate_uncertainty(smiles, candidate.get("type", "known"))

        adjustment = {"activity_adjustment": 0.0, "selectivity_adjustment": 0.0, "uncertainty_flags": []}
        if confidence < self.LLM_CALL_CONFIDENCE_THRESHOLD:
            adjustment = await self._get_llm_adjustment(smiles, reaction)

        activity = max(0.0, min(1.0, base_activity + adjustment.get("activity_adjustment", 0.0)))
        selectivity = max(0.0, min(100.0, base_selectivity + adjustment.get("selectivity_adjustment", 0.0)))
        stability = base_stability

        uncertainty_flags = adjustment.get("uncertainty_flags", [])
        if confidence < PREDICTION_UNCERTAINTY_THRESHOLD:
            uncertainty_flags.append("high_uncertainty_prediction")

        return {
            **candidate,
            "predicted_activity": round(activity, 4),
            "predicted_selectivity": round(selectivity, 2),
            "predicted_stability": round(stability, 1),
            "predicted_confidence": round(confidence, 3),
            "uncertainty_flags": uncertainty_flags,
            "score": round(self._compute_score(activity, selectivity, stability), 4),
        }

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        self.set_status("working", "Running property predictions...")

        all_candidates = context.get("all_candidates", [])
        reaction = context["reaction"]

        predicted = []
        for candidate in all_candidates:
            p = await self._predict_candidate(candidate, reaction)
            predicted.append(p)

        self.set_status("complete", f"Predicted properties for {len(predicted)} candidates")

        return {
            **context,
            "predicted_candidates": predicted,
            "oracle_log": f"Ran predictions on {len(predicted)} candidates",
        }
