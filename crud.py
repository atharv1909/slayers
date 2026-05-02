"""
All database operations. Import these instead of calling Supabase anywhere.
"""
import uuid
from typing import Optional
from sqlalchemy.orm import Session

from db.models import Project, Candidate, Experiment, Annotation, get_db


def create_project(user_id: str, name: str, reaction: str, reaction_type: str = "chemical") -> dict:
    db = get_db()
    try:
        project = Project(
            name=name,
            reaction=reaction,
            reaction_type=reaction_type,
            user_id=user_id,
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        return _project_to_dict(project)
    finally:
        db.close()


def get_projects_for_user(user_id: str) -> list[dict]:
    db = get_db()
    try:
        projects = db.query(Project).filter(Project.user_id == user_id).all()
        return [_project_to_dict(p) for p in projects]
    finally:
        db.close()


# --- Candidates ---

def get_candidates_for_project(project_id: str, type_filter: Optional[str] = None) -> list[dict]:
    db = get_db()
    try:
        q = db.query(Candidate).filter(Candidate.project_id == uuid.UUID(project_id))
        if type_filter:
            q = q.filter(Candidate.type == type_filter)
        return [_candidate_to_dict(c) for c in q.all()]
    finally:
        db.close()


def insert_candidates(candidates: list[dict]) -> list[dict]:
    db = get_db()
    try:
        objs = [
            Candidate(
                project_id=uuid.UUID(c["project_id"]),
                name=c["name"],
                smiles=c["smiles"],
                type=c.get("type", "known"),
                source_db=c.get("source_db"),
                predicted_activity=c.get("predicted_activity"),
                predicted_selectivity=c.get("predicted_selectivity"),
                predicted_stability=c.get("predicted_stability"),
                predicted_confidence=c.get("predicted_confidence"),
                metal_type=c.get("metal_type"),
                support_material=c.get("support_material"),
                metadata_=c.get("metadata", {}),
            )
            for c in candidates
        ]
        db.add_all(objs)
        db.commit()
        return [_candidate_to_dict(o) for o in objs]
    finally:
        db.close()


def update_candidate_actuals(
    candidate_id: str,
    actual_yield: float,
    actual_selectivity: float,
    actual_stability: float,
) -> Optional[dict]:
    db = get_db()
    try:
        c = db.query(Candidate).filter(Candidate.id == uuid.UUID(candidate_id)).first()
        if not c:
            return None
        c.actual_yield = actual_yield
        c.actual_selectivity = actual_selectivity
        c.actual_stability = actual_stability
        db.commit()
        db.refresh(c)
        return _candidate_to_dict(c)
    finally:
        db.close()


def update_candidate_predictions(candidate_id: str, new_predicted_yield: float, model_version: str) -> Optional[dict]:
    db = get_db()
    try:
        c = db.query(Candidate).filter(Candidate.id == uuid.UUID(candidate_id)).first()
        if not c:
            return None
        # Store adjusted prediction as activity (normalized)
        c.predicted_activity = min(1.0, new_predicted_yield / 100.0)
        meta = c.metadata_ or {}
        meta["model_version"] = model_version
        meta["retrained"] = True
        c.metadata_ = meta
        db.commit()
        db.refresh(c)
        return _candidate_to_dict(c)
    finally:
        db.close()


# --- Experiments ---

def insert_experiment(experiment: dict) -> dict:
    db = get_db()
    try:
        exp = Experiment(
            candidate_id=uuid.UUID(experiment["candidate_id"]),
            user_id=experiment["user_id"],
            yield_measured=experiment.get("yield_measured"),
            selectivity_measured=experiment.get("selectivity_measured"),
            stability_measured=experiment.get("stability_measured"),
            conditions=experiment.get("conditions", {}),
            notes=experiment.get("notes"),
        )
        db.add(exp)
        db.commit()
        db.refresh(exp)
        return _experiment_to_dict(exp)
    finally:
        db.close()


def get_experiments_for_candidate(candidate_id: str) -> list[dict]:
    db = get_db()
    try:
        exps = db.query(Experiment).filter(
            Experiment.candidate_id == uuid.UUID(candidate_id)
        ).order_by(Experiment.created_at.desc()).all()
        return [_experiment_to_dict(e) for e in exps]
    finally:
        db.close()


def get_experiments_for_project(project_id: str) -> list[dict]:
    """Join through candidates to get all experiments in a project."""
    db = get_db()
    try:
        results = (
            db.query(Experiment, Candidate)
            .join(Candidate, Experiment.candidate_id == Candidate.id)
            .filter(Candidate.project_id == uuid.UUID(project_id))
            .order_by(Experiment.created_at.desc())
            .all()
        )
        rows = []
        for exp, cand in results:
            row = _experiment_to_dict(exp)
            row["candidate"] = _candidate_to_dict(cand)
            rows.append(row)
        return rows
    finally:
        db.close()


# --- Serializers ---

def _project_to_dict(p: Project) -> dict:
    return {
        "id": str(p.id),
        "name": p.name,
        "reaction": p.reaction,
        "reaction_type": p.reaction_type,
        "status": p.status,
        "user_id": p.user_id,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


def _candidate_to_dict(c: Candidate) -> dict:
    return {
        "id": str(c.id),
        "project_id": str(c.project_id),
        "name": c.name,
        "smiles": c.smiles,
        "type": c.type,
        "source_db": c.source_db,
        "predicted_activity": c.predicted_activity,
        "predicted_selectivity": c.predicted_selectivity,
        "predicted_stability": c.predicted_stability,
        "predicted_confidence": c.predicted_confidence,
        "actual_yield": c.actual_yield,
        "actual_selectivity": c.actual_selectivity,
        "actual_stability": c.actual_stability,
        "metal_type": c.metal_type,
        "support_material": c.support_material,
        "metadata": c.metadata_ or {},
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


def _experiment_to_dict(e: Experiment) -> dict:
    return {
        "id": str(e.id),
        "candidate_id": str(e.candidate_id),
        "user_id": e.user_id,
        "yield_measured": e.yield_measured,
        "selectivity_measured": e.selectivity_measured,
        "stability_measured": e.stability_measured,
        "conditions": e.conditions or {},
        "notes": e.notes,
        "created_at": e.created_at.isoformat() if e.created_at else None,
    }
