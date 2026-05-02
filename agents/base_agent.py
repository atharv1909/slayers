from abc import ABC, abstractmethod
from typing import Any
from langchain_core.messages import BaseMessage
from langchain_groq import ChatGroq
from tenacity import retry, stop_after_attempt, wait_exponential
import logging

from config import GROQ_API_KEY, GROQ_MODEL_FAST

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Abstract base for all CatalysisAI discovery agents."""

    name: str = "BaseAgent"
    description: str = ""

    def __init__(self):
        self.llm = self._init_llm()
        self.status = "idle"
        self.current_task = ""

    def _init_llm(self, temperature: float = 0.3, model: str | None = None) -> ChatGroq:
        return ChatGroq(
            api_key=GROQ_API_KEY,
            model_name=model or GROQ_MODEL_FAST,
            temperature=temperature,
            max_tokens=2048,
        )

    def set_status(self, status: str, task: str = ""):
        self.status = status
        self.current_task = task
        logger.info(f"[{self.name}] {status}: {task}")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def invoke_llm(self, messages: list[BaseMessage]) -> str:
        response = await self.llm.ainvoke(messages)
        return response.content

    @abstractmethod
    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        ...

    def get_state(self) -> dict:
        return {
            "name": self.name,
            "status": self.status,
            "current_task": self.current_task,
        }
      
