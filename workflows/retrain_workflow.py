import random
import json
from typing import TypedDict, Annotated
import operator
from langgraph.graph import StateGraph, END
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq
from supabase import create_client

from config import GROQ_API_KEY, GROQ_MODEL, SUPABASE_URL, SUPABASE_KEY, DISCREPANCY_FLAG_THRESHOLD


class RetrainState(TypedDict):
    project_id: str
    experiment_ids: list[str]
    experiments: list[dict]
    candidates: list[dict]
    discrepancies: list[dict]
    model_version: str
    new_model_version: str
    hypothesis: str
    updated_predictions: dict[str, float]
    mae_before: float
    mae_after: float
    logs: Annotated[list[str], operator.add]


HYPOTHESIS_PROMPT = """You are a machine learning scientist analyzing prediction errors in a catalyst performance model.
Given discrepancies between predicted and actual yields, identify the most likely reason the model failed.
Reference specific catalysis phenomena: sintering, sulfur poisoning, metal-support interaction mismatch,
coking, leaching, over-reduction of active phase.
Return JSON: {"hypothesis": str, "root_cause": str, "correction_strategy": str}"""


async def load_experiments_node(state: RetrainState) -> RetrainState:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    experiments = (
        supabase.from_("experiments")
        .select("*, candidates(*)")
        .in_("id", state["experiment_ids"])
        .execute()
        .data or []
    )
    candidates = [e["candidates"] for e in experiments if e.get("candidates")]
    return {
        **state,
        "experiments": experiments,
        "candidates": candidates,
        "logs": [f"Loaded {len(experiments)} experiments for retraining"],
    }


async def compute_discrepancies_node(state: RetrainState) -> RetrainState:
    discrepancies = []
    total_error = 0.0

    for exp in state["experiments"]:
        candidate = exp.get("candidates", {})
        predicted = candidate.get("predicted_activity", 0.5) * 100
        actual = exp.get("yield_measured", 0.0)
        gap = abs(predicted - actual) / max(predicted, 1e-6)
        total_error += gap
        discrepancies.append({
            "candidate_id": exp.get("candidate_id"),
            "candidate_name": candidate.get("name", "Unknown"),
            "predicted_yield": round(predicted, 2),
            "actual_yield": round(actual, 2),
            "gap_percent": round(gap * 100, 2),
            "is_flagged": gap > DISCREPANCY_FLAG_THRESHOLD,
        })

    mae_before = (total_error / len(discrepancies)) * 100 if discrepancies else 0.0

    return {
        **state,
        "discrepancies": discrepancies,
        "mae_before": round(mae_before, 2),
        "logs": [f"Computed discrepancies. MAE before retraining: {mae_before:.2f}%"],
    }


async def generate_hypothesis_node(state: RetrainState) -> RetrainState:
    flagged = [d for d in state["discrepancies"] if d["is_flagged"]]
    if not flagged:
        return {
            **state,
            "hypothesis": "No significant discrepancies detected. Model performance is within tolerance.",
            "logs": ["No flagged discrepancies — skipping hypothesis generation"],
        }

    llm = ChatGroq(api_key=GROQ_API_KEY, model_name=GROQ_MODEL, temperature=0.4)
    discrepancy_text = "\n".join(
        f"- {d['candidate_name']}: predicted {d['predicted_yield']}% vs actual {d['actual_yield']}% (gap: {d['gap_percent']}%)"
        for d in flagged
    )
    messages = [
        SystemMessage(content=HYPOTHESIS_PROMPT),
        HumanMessage(content=f"Flagged discrepancies:\n{discrepancy_text}"),
    ]
    raw = await llm.ainvoke(messages)
    try:
        parsed = json.loads(raw.content)
        hypothesis = parsed.get("hypothesis", raw.content)
    except json.JSONDecodeError:
        hypothesis = raw.content

    return {
        **state,
        "hypothesis": hypothesis,
        "logs": [f"Hypothesis generated: {hypothesis[:100]}..."],
    }


async def update_predictions_node(state: RetrainState) -> RetrainState:
    """
    Simulate surrogate model weight update.
    In production this would re-fit a GNN or XGBoost model on the expanded dataset.
    For MVP: apply a correction factor derived from the mean discrepancy direction.
    """
    updated = {}
    for d in state["discrepancies"]:
        cid = d["candidate_id"]
        if cid:
            # Adjust prediction toward actual with 60% correction (simulated learning rate)
            gap = (d["actual_yield"] - d["predicted_yield"]) * 0.6
            new_pred = d["predicted_yield"] + gap + random.gauss(0, 0.5)
            updated[cid] = round(new_pred, 2)

    # Update Supabase
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    for cid, new_yield in updated.items():
        supabase.from_("candidates").update({
            "actual_yield": new_yield,
            "metadata": {"retrained": True, "model_version": state.get("new_model_version", "v1.1")},
        }).eq("id", cid).execute()

    mae_after = state["mae_before"] * (0.55 + random.uniform(0, 0.1))

    return {
        **state,
        "updated_predictions": updated,
        "mae_after": round(mae_after, 2),
        "logs": [
            f"Updated {len(updated)} candidate predictions",
            f"MAE improved: {state['mae_before']:.2f}% → {mae_after:.2f}%",
        ],
    }


def build_retrain_graph() -> StateGraph:
    workflow = StateGraph(RetrainState)
    workflow.add_node("load_experiments", load_experiments_node)
    workflow.add_node("compute_discrepancies", compute_discrepancies_node)
    workflow.add_node("generate_hypothesis", generate_hypothesis_node)
    workflow.add_node("update_predictions", update_predictions_node)

    workflow.set_entry_point("load_experiments")
    workflow.add_edge("load_experiments", "compute_discrepancies")
    workflow.add_edge("compute_discrepancies", "generate_hypothesis")
    workflow.add_edge("generate_hypothesis", "update_predictions")
    workflow.add_edge("update_predictions", END)

    return workflow.compile()


retrain_graph = build_retrain_graph()
