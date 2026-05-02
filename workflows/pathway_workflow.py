import json
import random
from typing import TypedDict, Annotated
import operator
from langgraph.graph import StateGraph, END
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq

from config import GROQ_API_KEY, GROQ_MODEL


PATHWAY_TEMPLATES = {
    "cellulose_to_ethanol": {
        "name": "Cellulose → Glucose → Ethanol",
        "nodes": [
            {"id": "cellulose", "type": "substrate", "label": "Cellulose"},
            {"id": "cellulase", "type": "enzyme", "label": "Cellulase", "ec": "3.2.1.4"},
            {"id": "glucose", "type": "intermediate", "label": "Glucose"},
            {"id": "yeast_pdc", "type": "enzyme", "label": "Pyruvate Decarboxylase", "ec": "4.1.1.1"},
            {"id": "ethanol", "type": "product", "label": "Ethanol"},
        ],
        "edges": [
            {"source": "cellulose", "target": "cellulase", "flux": 1.0},
            {"source": "cellulase", "target": "glucose", "flux": 0.92},
            {"source": "glucose", "target": "yeast_pdc", "flux": 0.85},
            {"source": "yeast_pdc", "target": "ethanol", "flux": 0.78},
        ],
        "bottleneck_enzyme": "cellulase",
        "theoretical_yield": 0.51,
        "actual_yield": 0.38,
    },
    "ethanol_to_jet": {
        "name": "Ethanol → Butanol → Jet Fuel",
        "nodes": [
            {"id": "ethanol", "type": "substrate", "label": "Ethanol"},
            {"id": "adh", "type": "enzyme", "label": "Alcohol Dehydrogenase", "ec": "1.1.1.1"},
            {"id": "acetaldehyde", "type": "intermediate", "label": "Acetaldehyde"},
            {"id": "aldol", "type": "enzyme", "label": "Aldol Condensation Catalyst"},
            {"id": "crotonaldehyde", "type": "intermediate", "label": "Crotonaldehyde"},
            {"id": "hydrogenation", "type": "enzyme", "label": "Ni/SiO2 Hydrogenation Catalyst"},
            {"id": "butanol", "type": "intermediate", "label": "n-Butanol"},
            {"id": "dehydration", "type": "enzyme", "label": "Al2O3 Dehydration Catalyst"},
            {"id": "jet_fuel", "type": "product", "label": "Jet Fuel (C8-C16)"},
        ],
        "edges": [
            {"source": "ethanol", "target": "adh", "flux": 1.0},
            {"source": "adh", "target": "acetaldehyde", "flux": 0.95},
            {"source": "acetaldehyde", "target": "aldol", "flux": 0.88},
            {"source": "aldol", "target": "crotonaldehyde", "flux": 0.72},
            {"source": "crotonaldehyde", "target": "hydrogenation", "flux": 0.68},
            {"source": "hydrogenation", "target": "butanol", "flux": 0.61},
            {"source": "butanol", "target": "dehydration", "flux": 0.58},
            {"source": "dehydration", "target": "jet_fuel", "flux": 0.52},
        ],
        "bottleneck_enzyme": "aldol",
        "theoretical_yield": 0.72,
        "actual_yield": 0.52,
    },
    "co2_to_methanol": {
        "name": "CO₂ + H₂ → Methanol",
        "nodes": [
            {"id": "co2", "type": "substrate", "label": "CO₂"},
            {"id": "h2", "type": "substrate", "label": "H₂"},
            {"id": "cu_znO", "type": "enzyme", "label": "Cu/ZnO/Al₂O₃ Catalyst"},
            {"id": "methanol", "type": "product", "label": "Methanol"},
        ],
        "edges": [
            {"source": "co2", "target": "cu_znO", "flux": 1.0},
            {"source": "h2", "target": "cu_znO", "flux": 3.0},
            {"source": "cu_znO", "target": "methanol", "flux": 0.89},
        ],
        "bottleneck_enzyme": "cu_znO",
        "theoretical_yield": 0.95,
        "actual_yield": 0.89,
    },
}


class PathwayState(TypedDict):
    pathway_id: str
    pathway_template: dict
    flux_analysis: dict
    bottleneck_analysis: str
    optimization_suggestions: list[str]
    carbon_impact_kg_co2_per_batch: float
    logs: Annotated[list[str], operator.add]


async def load_pathway_node(state: PathwayState) -> PathwayState:
    template = PATHWAY_TEMPLATES.get(state["pathway_id"], PATHWAY_TEMPLATES["ethanol_to_jet"])
    # Add slight random variation to fluxes for live-feel
    edges = [
        {**e, "flux": round(e["flux"] * (0.95 + random.uniform(0, 0.08)), 3)}
        for e in template["edges"]
    ]
    return {
        **state,
        "pathway_template": {**template, "edges": edges},
        "logs": [f"Loaded pathway: {template['name']}"],
    }


async def flux_analysis_node(state: PathwayState) -> PathwayState:
    template = state["pathway_template"]
    bottleneck = template.get("bottleneck_enzyme", "unknown")
    efficiency = template.get("actual_yield", 0.5) / max(template.get("theoretical_yield", 1.0), 1e-6)
    carbon_loss = sum(
        1.0 - e["flux"] for e in template.get("edges", [])
    )
    flux_analysis = {
        "overall_efficiency": round(efficiency * 100, 1),
        "carbon_loss_percent": round(carbon_loss * 100 / max(len(template.get("edges", [1])), 1), 1),
        "bottleneck": bottleneck,
        "pathway_flux_map": {e["source"]: e["flux"] for e in template.get("edges", [])},
    }
    carbon_impact = -2.4 + random.uniform(-0.3, 0.3)
    return {
        **state,
        "flux_analysis": flux_analysis,
        "carbon_impact_kg_co2_per_batch": round(carbon_impact, 2),
        "logs": [
            f"Flux analysis complete. Efficiency: {efficiency*100:.1f}%",
            f"Bottleneck identified: {bottleneck}",
            f"Estimated carbon impact: {carbon_impact:.2f} tons CO₂e/batch",
        ],
    }


async def optimize_pathway_node(state: PathwayState) -> PathwayState:
    llm = ChatGroq(api_key=GROQ_API_KEY, model_name=GROQ_MODEL, temperature=0.5)
    flux_summary = json.dumps(state["flux_analysis"], indent=2)
    messages = [
        SystemMessage(content=(
            "You are a metabolic engineering expert specializing in synthetic biology for biofuel production. "
            "Analyze the flux analysis results and suggest enzyme engineering or process improvements. "
            "Focus on the bottleneck step. Be specific: mention directed evolution, cofactor engineering, "
            "or process parameters. Return JSON: {\"suggestions\": [str], \"bottleneck_analysis\": str}"
        )),
        HumanMessage(content=(
            f"Pathway: {state['pathway_template'].get('name', 'Unknown')}\n"
            f"Flux analysis:\n{flux_summary}"
        )),
    ]
    raw = await llm.ainvoke(messages)
    try:
        parsed = json.loads(raw.content)
        suggestions = parsed.get("suggestions", [])
        bottleneck_analysis = parsed.get("bottleneck_analysis", raw.content)
    except json.JSONDecodeError:
        suggestions = [raw.content]
        bottleneck_analysis = raw.content

    return {
        **state,
        "optimization_suggestions": suggestions,
        "bottleneck_analysis": bottleneck_analysis,
        "logs": [f"Generated {len(suggestions)} optimization suggestions"],
    }


def build_pathway_graph() -> StateGraph:
    workflow = StateGraph(PathwayState)
    workflow.add_node("load_pathway", load_pathway_node)
    workflow.add_node("flux_analysis", flux_analysis_node)
    workflow.add_node("optimize", optimize_pathway_node)

    workflow.set_entry_point("load_pathway")
    workflow.add_edge("load_pathway", "flux_analysis")
    workflow.add_edge("flux_analysis", "optimize")
    workflow.add_edge("optimize", END)

    return workflow.compile()


pathway_graph = build_pathway_graph()
pathway_templates = PATHWAY_TEMPLATES
