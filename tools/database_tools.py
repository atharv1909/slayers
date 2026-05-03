from langchain_core.tools import tool
from db.crud import (
    get_candidates_for_project,
    get_experiments_for_candidate,
    get_experiments_for_project,
    insert_candidates,
    insert_experiment,
    update_candidate_actuals,
)


@tool
def get_project_candidates_tool(project_id: str, candidate_type: str = "known") -> list[dict]:
    """Retrieve candidates from a project, optionally filtered by type (known/novel)."""
    return get_candidates_for_project(project_id, type_filter=candidate_type)


@tool
def get_candidate_experiments_tool(candidate_id: str) -> list[dict]:
    """Retrieve all experiments logged for a specific candidate."""
    return get_experiments_for_candidate(candidate_id)


@tool
def get_project_experiments_tool(project_id: str) -> list[dict]:
    """Get all experiments across all candidates in a project."""
    return get_experiments_for_project(project_id)


@tool
def log_experiment_tool(experiment: dict) -> dict:
    """Insert a new experiment result into the database."""
    return insert_experiment(experiment)


@tool
def update_candidate_actuals_tool(
    candidate_id: str,
    actual_yield: float,
    actual_selectivity: float,
    actual_stability: float,
) -> dict:
    """Update a candidate's measured experimental results."""
    return update_candidate_actuals(candidate_id, actual_yield, actual_selectivity, actual_stability) or {}
