import chromadb
from chromadb.config import Settings
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

from config import CHROMA_PERSIST_DIR, OPENAI_API_KEY, EMBEDDING_MODEL


_vector_store: Chroma | None = None


def get_embeddings() -> OpenAIEmbeddings:
    return OpenAIEmbeddings(
        api_key=OPENAI_API_KEY,
        model=EMBEDDING_MODEL,
    )


def get_vector_store(docs: list[Document] | None = None) -> Chroma:
    global _vector_store
    if _vector_store is not None:
        return _vector_store

    embeddings = get_embeddings()
    client = chromadb.PersistentClient(
        path=CHROMA_PERSIST_DIR,
        settings=Settings(anonymized_telemetry=False),
    )

    if docs:
        _vector_store = Chroma.from_documents(
            documents=docs,
            embedding=embeddings,
            client=client,
            collection_name="catalysis_kb",
        )
    else:
        _vector_store = Chroma(
            client=client,
            collection_name="catalysis_kb",
            embedding_function=embeddings,
        )

    return _vector_store


def index_documents(docs: list[Document]) -> int:
    store = get_vector_store(docs=docs)
    return store._collection.count()


def similarity_search(query: str, k: int = 5) -> list[Document]:
    store = get_vector_store()
    return store.similarity_search(query, k=k)


def similarity_search_with_score(query: str, k: int = 5) -> list[tuple[Document, float]]:
    store = get_vector_store()
    return store.similarity_search_with_score(query, k=k)
