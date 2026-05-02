from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_core.callbacks import CallbackManagerForRetrieverRun, AsyncCallbackManagerForRetrieverRun

from rag.vector_store import similarity_search, similarity_search_with_score
from config import TOP_K_RETRIEVAL


class ChemistryRetriever(BaseRetriever):
    """
    Retrieves relevant chemistry knowledge from ChromaDB.
    Used by Scout and Sage agents to ground generation in real catalysis science.
    """

    k: int = TOP_K_RETRIEVAL

    def _get_relevant_documents(
        self,
        query: str,
        *,
        run_manager: CallbackManagerForRetrieverRun,
    ) -> list[Document]:
        return similarity_search(query, k=self.k)

    async def _aget_relevant_documents(
        self,
        query: str,
        *,
        run_manager: AsyncCallbackManagerForRetrieverRun,
    ) -> list[Document]:
        # ChromaDB is sync — run in thread pool for async compatibility
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, similarity_search, query, self.k)

    def retrieve_with_scores(self, query: str) -> list[tuple[Document, float]]:
        return similarity_search_with_score(query, k=self.k)

    def format_context(self, docs: list[Document]) -> str:
        """Format retrieved docs into a single context string for LLM injection."""
        sections = []
        for doc in docs:
            title = doc.metadata.get("title", "Reference")
            source = doc.metadata.get("source", "")
            sections.append(f"[{title}]\n{doc.page_content}\nSource: {source}")
        return "\n\n---\n\n".join(sections)
