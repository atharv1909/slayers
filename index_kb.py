"""
Index the chemistry knowledge base into ChromaDB for RAG retrieval.
Run: python scripts/index_kb.py
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "ai"))

from rag.knowledge_base import load_knowledge_base
from rag.vector_store import index_documents, get_vector_store


def main():
    print("📚 Loading chemistry knowledge base...")
    docs = load_knowledge_base()
    print(f"   → Loaded {len(docs)} document chunks")

    print(f"🔢 Embedding and indexing into ChromaDB...")
    count = index_documents(docs)
    print(f"   → Indexed {count} chunks")

    print("\n🔍 Running test retrieval...")
    store = get_vector_store()
    results = store.similarity_search("ethanol to jet fuel catalyst", k=3)
    for i, doc in enumerate(results):
        title = doc.metadata.get("title", "Unknown")
        snippet = doc.page_content[:100].replace("\n", " ")
        print(f"   [{i+1}] {title}: {snippet}...")

    print("\n✅ Knowledge base indexed successfully.")


if __name__ == "__main__":
    main()
