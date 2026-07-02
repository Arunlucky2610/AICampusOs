import logging
from typing import Optional

import httpx

from app.core.ai_config import get_ai_client_config
from app.core.config import get_settings

logger = logging.getLogger(__name__)

_asr_client: Optional[httpx.Client] = None
_tts_client: Optional[httpx.Client] = None

FALLBACK_ASR_MODEL = "whisper-large-v3-turbo"
TTS_VOICE = "angie"


def _get_asr_model() -> str:
    model = get_settings().stt_provider_model
    return model or "nvidia/canary-0.6b"


def _get_tts_model() -> str:
    model = get_settings().tts_provider_model
    return model or "nvidia/parakeet-tts-0.6b"


def _get_base_config():
    config = get_ai_client_config()
    return config.base_url, config.api_key


def _get_asr_client() -> httpx.Client:
    global _asr_client
    if _asr_client is None:
        base_url, api_key = _get_base_config()
        _asr_client = httpx.Client(
            base_url=base_url,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=120.0,
        )
    return _asr_client


def _get_tts_client() -> httpx.Client:
    global _tts_client
    if _tts_client is None:
        base_url, api_key = _get_base_config()
        _tts_client = httpx.Client(
            base_url=base_url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            timeout=120.0,
        )
    return _tts_client


def _do_asr(client: httpx.Client, model: str, audio_data: bytes, filename: str) -> Optional[str]:
    files = {"file": (filename, audio_data, "audio/webm")}
    data = {"model": model, "language": "en", "response_format": "json"}

    try:
        response = client.post("/audio/transcriptions", data=data, files=files)
    except httpx.TimeoutException:
        logger.warning("NVIDIA ASR timed out (model=%s)", model)
        return None
    except httpx.RequestError as exc:
        logger.warning("NVIDIA ASR request failed (model=%s): %s", model, exc)
        return None

    if response.status_code == 404:
        logger.warning("NVIDIA ASR endpoint not found (model=%s)", model)
        return None
    if response.status_code != 200:
        logger.warning("NVIDIA ASR returned %s (model=%s): %s", response.status_code, model, response.text[:300])
        return None

    try:
        result = response.json()
        text = result.get("text", "")
        return text.strip() or None
    except Exception as exc:
        logger.warning("Failed to parse ASR response (model=%s): %s", model, exc)
        return None


def transcribe_audio(audio_data: bytes, filename: str = "audio.webm") -> Optional[str]:
    client = _get_asr_client()
    primary_model = _get_asr_model()

    result = _do_asr(client, primary_model, audio_data, filename)
    if result is not None:
        return result

    if primary_model != FALLBACK_ASR_MODEL:
        logger.info("ASR primary model failed, trying fallback: %s", FALLBACK_ASR_MODEL)
        result = _do_asr(client, FALLBACK_ASR_MODEL, audio_data, filename)
        if result is not None:
            return result

    return None


def synthesize_speech(text: str) -> Optional[bytes]:
    client = _get_tts_client()
    model = _get_tts_model()

    payload = {
        "model": model,
        "input": text,
        "voice": TTS_VOICE,
        "response_format": "wav",
    }

    try:
        response = client.post("/audio/speech", json=payload)
    except httpx.TimeoutException:
        logger.warning("NVIDIA TTS timed out")
        return None
    except httpx.RequestError as exc:
        logger.warning("NVIDIA TTS request failed: %s", exc)
        return None

    if response.status_code == 404:
        logger.warning("NVIDIA TTS endpoint not found (model=%s)", model)
        return None
    if response.status_code != 200:
        logger.warning("NVIDIA TTS returned %s: %s", response.status_code, response.text[:300])
        return None

    return response.content
