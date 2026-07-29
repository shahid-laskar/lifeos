"""
AI gateway implementations.

The domain service depends only on the AIGateway Protocol. Concrete
implementations live here in the infrastructure layer.

StubAIGateway: development stub — returns honest placeholder responses without
making any network call. Used when MLOS_AI_PROVIDER is not set.

OpenAIGateway: routes to OpenAI-compatible endpoints. Requires
MLOS_OPENAI_API_KEY. This is a thin HTTP wrapper; prompt construction and
safety policy live in the domain layer (prompts.py, service.py).
"""
from __future__ import annotations

import logging

logger = logging.getLogger("mlos.ai")


class StubAIGateway:
    """Development stub — no network calls, no API key required."""

    def complete(
        self,
        messages: list[dict],
        *,
        model: str,
        max_tokens: int,
        temperature: float,
    ) -> str:
        last_user = next(
            (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
        )
        return (
            "[AI gateway is not configured - this is a placeholder response.] "
            f"You asked: '{last_user[:100]}'. "
            "To enable real AI responses, set MLOS_AI_PROVIDER and the "
            "corresponding API key environment variables."
        )


class OpenAIGateway:
    """OpenAI-compatible gateway (works with OpenAI and Azure OpenAI).

    Requires: pip install openai
    Config: MLOS_OPENAI_API_KEY, optionally MLOS_OPENAI_BASE_URL.
    """

    def __init__(self, api_key: str, base_url: str | None = None) -> None:
        try:
            import openai  # noqa: PLC0415
        except ImportError as exc:
            raise RuntimeError(
                "openai package is required for OpenAIGateway. "
                "Add it to requirements.txt."
            ) from exc
        self._client = openai.OpenAI(api_key=api_key, base_url=base_url)

    def complete(
        self,
        messages: list[dict],
        *,
        model: str,
        max_tokens: int,
        temperature: float,
    ) -> str:
        response = self._client.chat.completions.create(
            model=model,
            messages=messages,  # type: ignore[arg-type]
            max_tokens=max_tokens,
            temperature=temperature,
        )
        content = response.choices[0].message.content
        if content is None:
            logger.warning("AI gateway returned empty content")
            return "I was unable to generate a response. Please try again."
        return content
