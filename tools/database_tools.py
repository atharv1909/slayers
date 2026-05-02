from langchain_core.tools import tool
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


@tool
def get_project_candidates(project_id: str, candidate_type: str = "known") -> list[dict]:
    """Retrieve candidates from a specific project in Supabase."""
    result = (
        get_supabase()
        .from_("candidates")
        .select("*")
        .eq("project_id", project_id)
        .eq("type", candidate_type)
        .order("created_at", desc=False)
        .execute()
    )
    return result.data or []


@tool
def get_candidate_experiments(candidate_id: str) -> list[dict]:
    """Retrieve all experiments for a specific candidate."""
    result = (
        get_supabase()
        .from_("experiments")
        .select("*")
        .eq("candidate_id", candidate_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@tool
def upsert_candidate(candidate: dict) -> dict:
    """Insert or update a candidate record in Supabase."""
    result = (
        get_supabase()
        .from_("candidates")
        .upsert(candidate)
        .execute()
    )
    return result.data[0] if result.data else {}


@tool
def get_project_experiments(project_id: str) -> list[dict]:
    """Get all experiments across all candidates in a project."""
    result = (
        get_supabase()
        .from_("experiments")
        .select("*, candidates!inner(project_id, name, predicted_activity)")
        .eq("candidates.project_id", project_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


def insert_experiment(experiment: dict) -> dict:
    """Insert a new experiment record."""
    result = (
        get_supabase()
        .from_("experiments")
        .insert(experiment)
        .execute()
    )
    return result.data[0] if result.data else {}


def update_candidate_actuals(
    candidate_id: str,
    actual_yield: float,
    actual_selectivity: float,
    actual_stability: float,
) -> dict:
    result = (
        get_supabase()
        .from_("candidates")
        .update({
            "actual_yield": actual_yield,
            "actual_selectivity": actual_selectivity,
            "actual_stability": actual_stability,
        })
        .eq("id", candidate_id)
        .execute()
    )
    return result.data[0] if result.data else {}
