from typing import Any
from langchain_core.messages import SystemMessage, HumanMessage

from agents.base_agent import BaseAgent
from rag.retriever import ChemistryRetriever
from db.crud import get_candidates_for_project

# Known catalyst databases indexed in our system
KNOWN_DATABASES = ["Materials Project", "Open Catalyst DB", "BRENDA", "CatDB"]

# Curated seed catalysts for common reactions
SEED_CATALYSTS = {
    "CO2 hydrogenation": [
        {"name": "Cu/ZnO/Al2O3", "smiles": "[Cu].[Zn].[Al]", "source_db": "Open Catalyst DB"},
        {"name": "In2O3/ZrO2", "smiles": "[In].[Zr]", "source_db": "Materials Project"},
        {"name": "Fe-K/Al2O3", "smiles": "[Fe].[K].[Al]", "source_db": "CatDB"},
    ],
    "ethanol dehydration": [
        {"name": "H-ZSM-5", "smiles": "[Al].[Si].[O]", "source_db": "CatDB"},
        {"name": "Al2O3", "smiles": "[Al+3].[O-2]", "source_db": "Materials Project"},
    ],
    "ethanol to jet": [
        {"name": "Ni/MgO", "smiles": "[Ni].[Mg].[O]", "source_db": "Open Catalyst DB"},
        {"name": "Co/SiO2", "smiles": "[Co].[Si].[O]", "source_db": "Materials Project"},
        {"name": "Pd/C", "smiles": "[Pd].[C]", "source_db": "BRENDA"},
        {"name": "Pt/Al2O3", "smiles": "[Pt].[Al].[O]", "source_db": "Open Catalyst DB"},
        {"name": "Ru/TiO2", "smiles": "[Ru].[Ti].[O]", "source_db": "Materials Project"},
        {"name": "Fe-Co/SiO2", "smiles": "[Fe].[Co].[Si].[O]", "source_db": "CatDB"},
        {"name": "Cu-Zn/ZSM-5", "smiles": "[Cu].[Zn].[Al].[Si].[O]", "source_db": "CatDB"},
        {"name": "Mo2C/Al2O3", "smiles": "[Mo].[C].[Al].[O]", "source_db": "Materials Project"},
    ],
}


class ScoutAgent(BaseAgent):
    """
    Scout Agent (🔍)
    Searches Supabase project DB + ChromaDB knowledge base for relevant known catalysts.
    Matches reaction type to seed database, retrieves literature context for downstream agents.
    """

    name = "Scout"
    description = "Searches catalyst databases and literature for known candidates."

    def __init__(self):
        super().__init__()
        self.retriever = ChemistryRetriever()

    def _match_reaction_to_seeds(self, reaction: str) -> list[dict]:
        reaction_lower = reaction.lower()
        for key, catalysts in SEED_CATALYSTS.items():
            if any(term in reaction_lower for term in key.split()):
                return catalysts
        # Default: return all seeds merged
        return [c for cats in SEED_CATALYSTS.values() for c in cats][:8]

    async def _fetch_from_db(self, project_id: str) -> list[dict]:
        return get_candidates_for_project(project_id, type_filter="known")

    async def _retrieve_literature(self, reaction: str) -> str:
        docs = await self.retriever.aget_relevant_documents(reaction)
        return "\n\n".join(d.page_content for d in docs[:3])

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        self.set_status("working", "Searching catalyst databases...")

        project_id = context["project_id"]
        reaction = context["reaction"]

        # Fetch existing candidates from project DB
        db_candidates = await self._fetch_from_db(project_id)

        # If no existing, fall back to seeds
        if not db_candidates:
            db_candidates = self._match_reaction_to_seeds(reaction)

        # Retrieve relevant literature chunks
        literature_context = await self._retrieve_literature(reaction)

        # Ask LLM to synthesize which known catalysts are most relevant
        messages = [
            SystemMessage(content=(
                "You are a computational chemist specializing in heterogeneous catalysis. "
                "Rank the provided known catalysts by relevance to the target reaction. "
                "Return JSON: {\"ranked\": [{\"name\": str, \"relevance_score\": float, \"reasoning\": str}]}"
            )),
            HumanMessage(content=(
                f"Target reaction: {reaction}\n"
                f"Known catalysts: {[c['name'] for c in db_candidates]}\n"
                f"Literature context:\n{literature_context}"
            )),
        ]
        ranking_raw = await self.invoke_llm(messages)

        self.set_status("complete", f"Found {len(db_candidates)} known catalysts")

        return {
            **context,
            "known_candidates": db_candidates,
            "literature_context": literature_context,
            "scout_ranking": ranking_raw,
            "scout_log": f"Retrieved {len(db_candidates)} candidates from {', '.join(KNOWN_DATABASES)}",
        }
