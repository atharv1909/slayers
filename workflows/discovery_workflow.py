from typing import TypedDict, Annotated
import operator
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage

from agents.scout_agent import ScoutAgent
from agents.designer_agent import DesignerAgent
from agents.oracle_agent import OracleAgent
from agents.sage_agent import SageAgent


class DiscoveryState(TypedDict):
    project_id: str
    reaction: str
    known_candidates: list[dict]
    novel_candidates: list[dict]
    all_candidates: list[dict]
    predicted_candidates: list[dict]
    ranked_candidates: list[dict]
    literature_context: str
    insight_report: dict
    top_candidate: dict | None
    logs: Annotated[list[str], operator.add]
    error: str | None


async def scout_node(state: DiscoveryState) -> DiscoveryState:
    agent = ScoutAgent()
    result = await agent.run(dict(state))
    return {
        **state,
        "known_candidates": result.get("known_candidates", []),
        "literature_context": result.get("literature_context", ""),
        "logs": [result.get("scout_log", "Scout complete")],
    }


async def designer_node(state: DiscoveryState) -> DiscoveryState:
    agent = DesignerAgent()
    result = await agent.run(dict(state))
    return {
        **state,
        "novel_candidates": result.get("novel_candidates", []),
        "all_candidates": result.get("all_candidates", []),
        "logs": [result.get("designer_log", "Designer complete")],
    }


async def oracle_node(state: DiscoveryState) -> DiscoveryState:
    agent = OracleAgent()
    result = await agent.run(dict(state))
    return {
        **state,
        "predicted_candidates": result.get("predicted_candidates", []),
        "logs": [result.get("oracle_log", "Oracle complete")],
    }


async def sage_node(state: DiscoveryState) -> DiscoveryState:
    agent = SageAgent()
    result = await agent.run(dict(state))
    return {
        **state,
        "ranked_candidates": result.get("ranked_candidates", []),
        "insight_report": result.get("insight_report", {}),
        "top_candidate": result.get("top_candidate"),
        "logs": [result.get("sage_log", "Sage complete")],
    }


def should_continue_after_scout(state: DiscoveryState) -> str:
    """Route to designer, or end early if we already have enough known candidates."""
    if state.get("error"):
        return END
    return "designer"


def build_discovery_graph() -> StateGraph:
    workflow = StateGraph(DiscoveryState)

    workflow.add_node("scout", scout_node)
    workflow.add_node("designer", designer_node)
    workflow.add_node("oracle", oracle_node)
    workflow.add_node("sage", sage_node)

    workflow.set_entry_point("scout")

    workflow.add_conditional_edges("scout", should_continue_after_scout, {
        "designer": "designer",
        END: END,
    })
    workflow.add_edge("designer", "oracle")
    workflow.add_edge("oracle", "sage")
    workflow.add_edge("sage", END)

    return workflow.compile()


# Compiled graph instance — import and invoke in API routes
discovery_graph = build_discovery_graph()
