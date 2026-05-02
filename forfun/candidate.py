from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class CandidateBase(BaseModel):
    name: str
    smiles: str
    type: str = Field(default="known", pattern="^(known|novel)$")
    source_db: Optional[str] = None
    metal_type: Optional[str] = None
    support_material: Optional[str] = None


class CandidatePrediction(BaseModel):
    predicted_activity: float = Field(ge=0.0, le=1.0)
    predicted_selectivity: float = Field(ge=0.0, le=100.0)
    predicted_stability: float = Field(ge=0.0)
    predicted_confidence: float = Field(ge=0.0, le=1.0)
    uncertainty_flags: list[str] = Field(default_factory=list)


class CandidateCreate(CandidateBase):
    project_id: str
    predicted_activity: Optional[float] = None
    predicted_selectivity: Optional[float] = None
    predicted_stability: Optional[float] = None
    predicted_confidence: Optional[float] = None
    metadata: dict = Field(default_factory=dict)


class CandidateFull(CandidateCreate):
    id: UUID
    actual_yield: Optional[float] = None
    actual_selectivity: Optional[float] = None
    actual_stability: Optional[float] = None
    score: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class GenerationResult(BaseModel):
    candidates: list[CandidateCreate]
    rationale: str
    generation_metadata: dict = Field(default_factory=dict)


class RankingResult(BaseModel):
    ranked_candidates: list[CandidateFull]
    top_candidate: CandidateFull
    insight_summary: str
