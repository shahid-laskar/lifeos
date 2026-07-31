"""
AI gateway implementations.

The domain service depends only on the AIGateway Protocol. Concrete
implementations live here in the infrastructure layer.

StubAIGateway: development stub — returns honest placeholder responses without
making any network call. Used when MLOS_AI_PROVIDER is not set.

OpenAIGateway: routes to OpenAI-compatible endpoints (OpenAI, OpenRouter,
Azure OpenAI, local proxies). Requires MLOS_OPENAI_API_KEY. This is a thin
HTTP wrapper; prompt construction and safety policy live in the domain layer
(prompts.py, service.py).
"""
from __future__ import annotations

import logging

logger = logging.getLogger("mlos.ai")

# Default OpenRouter base URL when MLOS_AI_PROVIDER=openrouter and no
# explicit MLOS_OPENAI_BASE_URL is set.
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini"


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
            "[AI gateway is not configured — this is a placeholder response.] "
            f"You asked: '{last_user[:100]}'. "
            "To enable real AI responses, set MLOS_AI_PROVIDER=openrouter "
            "(or openai) and MLOS_OPENAI_API_KEY.\n\n"
            "<!--mlos\n"
            "confidence: unknown\n"
            "sources:\n"
            "-->"
        )


class OpenAIGateway:
    """OpenAI-compatible gateway (OpenAI, OpenRouter, Azure, local proxies).

    Requires: pip install openai
    Config: MLOS_OPENAI_API_KEY, optionally MLOS_OPENAI_BASE_URL.
    """

    def __init__(
        self,
        api_key: str,
        base_url: str | None = None,
        *,
        default_headers: dict[str, str] | None = None,
    ) -> None:
        try:
            import openai  # noqa: PLC0415
        except ImportError as exc:
            raise RuntimeError(
                "openai package is required for OpenAIGateway. "
                "Add it to requirements.txt."
            ) from exc
        kwargs: dict = {"api_key": api_key}
        if base_url:
            kwargs["base_url"] = base_url
        if default_headers:
            kwargs["default_headers"] = default_headers
        self._client = openai.OpenAI(**kwargs)
        self._base_url = base_url

    def complete(
        self,
        messages: list[dict],
        *,
        model: str,
        max_tokens: int,
        temperature: float,
    ) -> str:
        try:
            response = self._client.chat.completions.create(
                model=model,
                messages=messages,  # type: ignore[arg-type]
                max_tokens=max_tokens,
                temperature=temperature,
            )
        except Exception:
            logger.exception("AI gateway completion failed (model=%s)", model)
            raise
        content = response.choices[0].message.content
        if content is None:
            logger.warning("AI gateway returned empty content")
            return (
                "I was unable to generate a response. Please try again.\n\n"
                "<!--mlos\n"
                "confidence: unknown\n"
                "sources:\n"
                "-->"
            )
        return content
