from functools import lru_cache
from typing import Literal, TypeVar

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.runnables import Runnable
from pydantic import BaseModel
from langchain_google_genai import (
    ChatGoogleGenerativeAI,
    GoogleGenerativeAIEmbeddings,
    HarmBlockThreshold,
    HarmCategory,
)
from langchain_openai import ChatOpenAI

from app.core.config import settings

ChatTier = Literal["primary", "secondary", "tertiary", "reranking"]


def _tier_model(tier: ChatTier) -> tuple[str, float]:
    mapping: dict[ChatTier, tuple[str, float]] = {
        "primary": (settings.primary_llm_model, settings.primary_temperature),
        "secondary": (settings.secondary_llm_model, settings.secondary_temperature),
        "tertiary": (settings.tertiary_llm_model, settings.tertiary_temperature),
        "reranking": (settings.reranking_llm_model, settings.reranking_temperature),
    }
    return mapping.get(tier, (settings.default_llm_model, settings.default_temperature))


@lru_cache
def get_chat_model(tier: ChatTier = "primary") -> BaseChatModel:
    model, temperature = _tier_model(tier)

    if settings.llm_provider == "openai":
        return ChatOpenAI(
            model=model,
            temperature=temperature,
            api_key=settings.openai_api_key,
        )

    safety_settings = {
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    }

    return ChatGoogleGenerativeAI(
        model=model,
        temperature=temperature,
        google_api_key=settings.gemini_api_key,
        safety_settings=safety_settings,
    )


SchemaT = TypeVar("SchemaT", bound=BaseModel)


def get_structured_model(tier: ChatTier, schema: type[SchemaT]) -> Runnable:
    """`get_chat_model(tier).with_structured_output(schema)`, provider-aware.

    OpenAI's native structured-output mode (the default for ChatOpenAI) requires
    every object in the schema to set `additionalProperties: false`, which our
    open-ended `dict[str, Any]` metadata fields don't. Function-calling mode
    doesn't have that restriction and matches how Gemini already handles this.
    """
    model = get_chat_model(tier)
    if settings.llm_provider == "openai":
        return model.with_structured_output(schema, method="function_calling")
    return model.with_structured_output(schema)


@lru_cache
def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    # Always Gemini, independent of llm_provider: existing Qdrant collections
    # were embedded with this model, and query vectors must stay in the same
    # space or similarity search silently returns garbage.
    return GoogleGenerativeAIEmbeddings(
        model=settings.embedding_model,
        google_api_key=settings.gemini_api_key,
        output_dimensionality=settings.embedding_dim,
    )
