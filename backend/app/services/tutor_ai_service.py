import json
import logging
from typing import AsyncGenerator, Optional

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

TUTOR_TIMEOUT = 90.0
TUTOR_MAX_TOKENS = 2048
TUTOR_TEMPERATURE = 0.4
TUTOR_TOP_P = 0.9

FALLBACK_MODEL = "meta/llama-3.3-70b-instruct"


def _get_tutor_config() -> dict:
    settings = get_settings()
    api_key = settings.ai_tutor_api_key or settings.nvidia_api_key
    if not api_key:
        raise RuntimeError("AI_TUTOR_API_KEY or NVIDIA_API_KEY must be set.")
    return {
        "base_url": (settings.ai_tutor_base_url or settings.ai_base_url).rstrip("/"),
        "api_key": api_key,
        "model": settings.ai_tutor_model,
        "fallback_model": settings.ai_tutor_fallback_model or FALLBACK_MODEL,
        "timeout": settings.ai_tutor_timeout or TUTOR_TIMEOUT,
        "max_tokens": settings.ai_tutor_max_tokens or TUTOR_MAX_TOKENS,
        "temperature": settings.ai_tutor_temperature or TUTOR_TEMPERATURE,
        "top_p": settings.ai_tutor_top_p or TUTOR_TOP_P,
    }


def _get_client(cfg: dict) -> httpx.Client:
    return httpx.Client(
        base_url=cfg["base_url"],
        headers={
            "Authorization": f"Bearer {cfg['api_key']}",
            "Content-Type": "application/json",
        },
        timeout=cfg["timeout"] + 5.0,
    )


def _extract_json(content: str) -> dict:
    content = content.strip()
    if content.startswith("```"):
        content = content.strip("`")
        if content.startswith("json"):
            content = content[4:]
        content = content.strip()
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        logger.warning("Tutor AI response not valid JSON, wrapping raw content")
        return {"raw_response": content}


def _run_completion(cfg: dict, model: str, system_prompt: str, user_prompt: str) -> dict:
    client = _get_client(cfg)
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": cfg["temperature"],
        "top_p": cfg["top_p"],
        "max_tokens": cfg["max_tokens"],
    }
    try:
        response = client.post("/chat/completions", json=payload, timeout=cfg["timeout"])
    except httpx.TimeoutException:
        raise RuntimeError(f"Model '{model}' timed out after {cfg['timeout']}s.")
    except httpx.RequestError as exc:
        raise RuntimeError(f"Model '{model}' request failed: {exc}")

    if response.status_code == 401:
        raise RuntimeError("Invalid AI Tutor API key.")
    if response.status_code == 404:
        raise RuntimeError(f"Model '{model}' not found or not accessible.")
    if response.status_code == 429:
        raise RuntimeError(f"Model '{model}' rate limited. Try again later.")
    if response.status_code != 200:
        body = response.text[:500]
        raise RuntimeError(f"Model '{model}' returned HTTP {response.status_code}: {body}")

    result = response.json()
    choices = result.get("choices", [])
    if not choices:
        raise RuntimeError(f"Model '{model}' returned empty response.")

    message = choices[0].get("message", {})
    content = message.get("content") or message.get("reasoning") or message.get("reasoning_content", "")
    if not content:
        raise RuntimeError(f"Model '{model}' returned empty message content.")

    return _extract_json(content)


def run_tutor_ai(system_prompt: str, user_prompt: str, model_override: Optional[str] = None) -> dict:
    cfg = _get_tutor_config()

    if model_override == "fallback":
        models_to_try = [cfg["fallback_model"]]
    elif model_override:
        models_to_try = [model_override]
    else:
        models_to_try = [cfg["model"], cfg["fallback_model"]]

    last_error = None
    for model in models_to_try:
        try:
            result = _run_completion(cfg, model, system_prompt, user_prompt)
            result["_model_used"] = model
            return result
        except RuntimeError as e:
            last_error = e
            logger.warning("Model '%s' failed: %s", model, e)
            if model != models_to_try[-1]:
                logger.info("Trying fallback model '%s'...", models_to_try[-1])
            else:
                raise last_error


_async_client: httpx.AsyncClient | None = None


async def _get_async_client() -> httpx.AsyncClient:
    global _async_client
    if _async_client is None:
        cfg = _get_tutor_config()
        _async_client = httpx.AsyncClient(
            base_url=cfg["base_url"],
            headers={
                "Authorization": f"Bearer {cfg['api_key']}",
                "Content-Type": "application/json",
            },
            timeout=cfg["timeout"] + 5.0,
        )
    return _async_client


async def stream_tutor_ai(system_prompt: str, user_prompt: str, model_override: Optional[str] = None) -> AsyncGenerator[str, None]:
    cfg = _get_tutor_config()

    if model_override == "fallback":
        model = cfg["fallback_model"]
    elif model_override:
        model = model_override
    else:
        model = cfg["model"]

    client = await _get_async_client()

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": cfg["temperature"],
        "top_p": cfg["top_p"],
        "max_tokens": cfg["max_tokens"],
        "stream": True,
    }

    buffer = ""
    try:
        async with client.stream("POST", "/chat/completions", json=payload, timeout=cfg["timeout"]) as response:
            if response.status_code != 200:
                error_body = await response.aread()
                msg = f"Model '{model}' error {response.status_code}: {error_body[:200].decode()}"
                yield f"data: {json.dumps({'type': 'error', 'content': msg})}\n\n"
                yield "data: [DONE]\n\n"
                return

            async for line in response.aiter_lines():
                if not line.startswith("data: "):
                    continue
                data_str = line[6:].strip()
                if data_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                    delta = chunk.get("choices", [{}])[0].get("delta", {})
                    token = delta.get("content") or delta.get("reasoning") or delta.get("reasoning_content", "")
                    if token:
                        buffer += token
                        yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                except json.JSONDecodeError:
                    continue

    except httpx.TimeoutException:
        msg = f"Model '{model}' timed out after {cfg['timeout']}s."
        yield f"data: {json.dumps({'type': 'error', 'content': msg})}\n\n"
        yield "data: [DONE]\n\n"
        return
    except httpx.RequestError as exc:
        msg = f"Model '{model}' request failed: {exc}"
        yield f"data: {json.dumps({'type': 'error', 'content': msg})}\n\n"
        yield "data: [DONE]\n\n"
        return

    result = _extract_json(buffer)
    yield f"data: {json.dumps({'type': 'result', 'content': result})}\n\n"
    yield "data: [DONE]\n\n"
