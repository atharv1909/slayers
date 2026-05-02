"""
PostgreSQL models via SQLAlchemy.
Replaces Supabase client. Works with any Postgres: Neon, Railway, local.
Run init_db() once to create tables.
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    create_engine, Column, String, Float, DateTime,
    ForeignKey, JSON, Text, CheckConstraint, event
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship, Session, sessionmaker
from sqlalchemy.pool import NullPool

from config import DATABASE_URL


engine = create_engine(DATABASE_URL, poolclass=NullPool, echo=False)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    reaction = Column(String, nullable=False)
    reaction_type = Column(String, default="chemical")
    status = Column(String, default="active")
    user_id = Column(String, nullable=False)  # Auth handled at app layer
    created_at = Column(DateTime, default=datetime.utcnow)

    candidates = relationship("Candidate", back_populates="project", cascade="all, delete-orphan")
    annotations = relationship("Annotation", back_populates="project", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("reaction_type IN ('chemical', 'biological')", name="ck_reaction_type"),
    )


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    smiles = Column(String, nullable=False)
    type = Column(String, default="known")
    source_db = Column(String)
    predicted_activity = Column(Float)
    predicted_selectivity = Column(Float)
    predicted_stability = Column(Float)
    predicted_confidence = Column(Float)
    actual_yield = Column(Float)
    actual_selectivity = Column(Float)
    actual_stability = Column(Float)
    metal_type = Column(String)
    support_material = Column(String)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="candidates")
    experiments = relationship("Experiment", back_populates="candidate", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("type IN ('known', 'novel')", name="ck_candidate_type"),
    )


class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, nullable=False)
    yield_measured = Column(Float)
    selectivity_measured = Column(Float)
    stability_measured = Column(Float)
    conditions = Column(JSON, default=dict)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="experiments")


class Annotation(Base):
    __tablename__ = "annotations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    target_type = Column(String)
    target_id = Column(UUID(as_uuid=True))
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="annotations")

    __table_args__ = (
        CheckConstraint("target_type IN ('candidate', 'pathway', 'chart')", name="ck_target_type"),
    )


def get_db() -> Session:
    db = SessionLocal()
    try:
        return db
    except Exception:
        db.close()
        raise


def init_db():
    """Create all tables. Run once on setup."""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created.")
