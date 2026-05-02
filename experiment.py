from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class ExperimentCreate(BaseModel):
    candidate_id: str
    user_id: str
    yield_measured: float = Field(ge=0.0, le=100.0)
    selectivity_measured: float = Field(ge=0.0, le=100.0)
    stability_measured: float = Field(ge=0.0)
    conditions: dict = Field(default_factory=dict)
    notes: Optional[str] = None


class DiscrepancyReport(BaseModel):
    candidate_id: str
    predicted_yield: float
    actual_yield: float
    gap_percent: float
    is_flagged: bool
    failure_hypotheses: list[str]
    recommended_experiments: list[str]


class RetrainRequest(BaseModel):
    project_id: str
    experiment_ids: list[str]
    model_version: str = "v1.0"


class RetrainResult(BaseModel):
    new_model_version: str
    candidates_updated: int
    mean_absolute_error_before: float
    mean_absolute_error_after: float
    hypothesis: str
    updated_predictions: dict[str, float]
