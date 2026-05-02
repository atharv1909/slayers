import os
from dotenv import load_dotenv

load_dotenv()


def _require(key: str) -> str:
    val = os.getenv(key)
    if not val:
        raise EnvironmentError(f"Required environment variable '{key}' is not set. Check your .env file.")
    return val

GROQ_API_KEY = _require("GROQ_API_KEY")
GROQ_MODEL_FAST = "llama3-70b-8192"
GROQ_MODEL_GENERATE = "llama3-70b-8192"


DATABASE_URL = _require("url....")

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
USE_LOCAL_EMBEDDINGS = os.getenv("USE_LOCAL_EMBEDDINGS", "true").lower() == "true"


MAX_NOVEL_CANDIDATES = 8
PREDICTION_UNCERTAINTY_THRESHOLD = 0.25
DISCREPANCY_FLAG_THRESHOLD = 0.20


ACTIVITY_WEIGHT = 0.40
SELECTIVITY_WEIGHT = 0.35
STABILITY_WEIGHT = 0.25


CHUNK_SIZE = 512
CHUNK_OVERLAP = 64
TOP_K_RETRIEVAL = 5
