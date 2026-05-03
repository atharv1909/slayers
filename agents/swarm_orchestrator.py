import asyncio
import time
from typing import Any, Callable, Awaitable

from agents.scout_agent import ScoutAgent
from agents.designer_agent import DesignerAgent
from agents.oracle_agent import OracleAgent
from agents.sage_agent import SageAgent
from db.crud import insert_candidates


AgentStatusCallback = Callable[[str, str, str], Awaitable[None]]


class DiscoverySwarm:
    """
    Orchestrates the 4-agent discovery pipeline sequentially.
    Scout → Designer → Oracle → Sage

    Accepts an optional async status_callback(agent_name, status, task)
    for streaming agent status updates to the frontend via SSE.
    """

    def __init__(self, status_callback: AgentStatusCallback | None = None):
        self.scout = ScoutAgent()
        self.designer = DesignerAgent()
        self.oracle = OracleAgent()
        self.sage = SageAgent()
        self.agents = [self.scout, self.designer, self.oracle, self.sage]
        self.status_callback = status_callback
        self.logs: list[str] = []

    def _log(self, message: str):
        timestamp = time.strftime("%H:%M:%S")
        self.logs.append(f"[{timestamp}] {message}")

    async def _emit(self, agent_name: str, status: str, task: str):
        if self.status_callback:
            await self.status_callback(agent_name, status, task)

    async def _save_novel_candidates(self, novel_candidates: list[dict], project_id: str):
        if not novel_candidates:
            return
        rows = [
            {
                "project_id": project_id,
                "name": c.get("name", "Unknown"),
                "smiles": c.get("smiles", ""),
                "type": "novel",
                "source_db": "AI Generated",
                "predicted_activity": c.get("predicted_activity"),
                "predicted_selectivity": c.get("predicted_selectivity"),
                "predicted_stability": c.get("predicted_stability"),
                "predicted_confidence": c.get("predicted_confidence"),
                "metal_type": c.get("metal_type"),
                "support_material": c.get("support_material"),
                "metadata": {
                    "rationale": c.get("rationale", ""),
                    "uncertainty_flags": c.get("uncertainty_flags", []),
                },
            }
            for c in novel_candidates
        ]
        insert_candidates(rows)

    async def run(self, project_id: str, reaction: str) -> dict[str, Any]:
        context: dict[str, Any] = {"project_id": project_id, "reaction": reaction}

        self._log("Scout Agent initializing database search...")
        await self._emit("Scout", "working", "Searching catalyst databases...")
        context = await self.scout.run(context)
        self._log(context.get("scout_log", ""))
        await self._emit("Scout", "complete", "Database search complete")

        self._log("Designer Agent generating novel SMILES...")
        await self._emit("Designer", "working", "Generating novel candidates...")
        context = await self.designer.run(context)
        self._log(context.get("designer_log", ""))
        await self._emit("Designer", "complete", "Novel candidates generated")

        self._log("Oracle Agent running property predictions...")
        await self._emit("Oracle", "working", "Predicting activity, selectivity, stability...")
        context = await self.oracle.run(context)
        self._log(context.get("oracle_log", ""))
        await self._emit("Oracle", "complete", "Predictions complete")

        self._log("Sage Agent synthesizing insights...")
        await self._emit("Sage", "working", "Synthesizing insights and ranking...")
        context = await self.sage.run(context)
        self._log(context.get("sage_log", ""))
        await self._emit("Sage", "complete", "Discovery complete")

        novel = context.get("novel_candidates", [])
        await self._save_novel_candidates(novel, project_id)
        self._log(f"Saved {len(novel)} novel candidates to database")

        return {
            "ranked_candidates": context.get("ranked_candidates", []),
            "insight_report": context.get("insight_report", {}),
            "top_candidate": context.get("top_candidate"),
            "known_count": len(context.get("known_candidates", [])),
            "novel_count": len(novel),
            "logs": self.logs,
            "agent_states": [a.get_state() for a in self.agents],
        }
