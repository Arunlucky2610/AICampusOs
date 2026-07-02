import logging
from dataclasses import dataclass

import httpx

from app.core.config import Settings, get_settings

logger = logging.getLogger(__name__)


class AIConfigurationError(RuntimeError):
    """Raised when AI integration settings are missing or invalid."""


@dataclass(frozen=True)
class AIClientConfig:
    provider: str
    base_url: str
    model: str
    api_key: str
    max_tokens: int
    cache_enabled: bool
    cache_ttl_minutes: int


def get_ai_client_config(settings: Settings | None = None) -> AIClientConfig:
    current_settings = settings or get_settings()
    return AIClientConfig(
        provider=current_settings.ai_provider,
        base_url=current_settings.ai_base_url.rstrip("/"),
        model=current_settings.ai_model,
        api_key=current_settings.nvidia_api_key,
        max_tokens=current_settings.max_ai_tokens,
        cache_enabled=current_settings.ai_cache_enabled,
        cache_ttl_minutes=current_settings.ai_cache_ttl_minutes,
    )


def validate_ai_configuration(settings: Settings | None = None) -> AIClientConfig:
    config = get_ai_client_config(settings)
    errors: list[str] = []

    if config.provider.lower() != "nvidia":
        errors.append("AI_PROVIDER must be set to 'nvidia'.")
    if not config.base_url:
        errors.append("AI_BASE_URL is required.")
    if not config.model:
        errors.append("AI_MODEL is required.")
    if not config.api_key:
        errors.append("NVIDIA_API_KEY is required for NVIDIA NIM API access.")
    if config.max_tokens <= 0:
        errors.append("MAX_AI_TOKENS must be greater than 0.")

    if errors:
        message = "AI configuration error: " + " ".join(errors)
        logger.error(message)
        raise AIConfigurationError(message)

    logger.info(
        "AI initialized: provider=%s model=%s base_url=%s cache_enabled=%s cache_ttl_minutes=%s max_tokens=%s",
        config.provider,
        config.model,
        config.base_url,
        config.cache_enabled,
        config.cache_ttl_minutes,
        config.max_tokens,
    )
    return config


def create_ai_client(settings: Settings | None = None) -> httpx.AsyncClient:
    config = validate_ai_configuration(settings)
    return httpx.AsyncClient(
        base_url=config.base_url,
        headers={
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json",
        },
        timeout=60.0,
    )
