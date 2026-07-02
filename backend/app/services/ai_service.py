import json
import logging
from typing import Optional

import httpx

from app.core.ai_config import get_ai_client_config, validate_ai_configuration
from app.models.student import Student

logger = logging.getLogger(__name__)

_client: Optional[httpx.Client] = None


AI_REQUEST_TIMEOUT = 180.0


def _get_client() -> httpx.Client:
    global _client
    if _client is None:
        config = validate_ai_configuration()
        _client = httpx.Client(
            base_url=config.base_url,
            headers={
                "Authorization": f"Bearer {config.api_key}",
                "Content-Type": "application/json",
            },
            timeout=AI_REQUEST_TIMEOUT + 5.0,
        )
    return _client


def run_ai(system_prompt: str, user_prompt: str) -> dict:
    config = get_ai_client_config()
    client = _get_client()

    logger.info("AI request: model=%s provider=%s base_url=%s max_tokens=%s timeout=%ss",
                config.model, config.provider, config.base_url, config.max_tokens, AI_REQUEST_TIMEOUT)
    logger.info("System prompt length=%d chars, User prompt length=%d chars",
                len(system_prompt), len(user_prompt))

    payload = {
        "model": config.model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.3,
        "max_tokens": config.max_tokens,
    }

    logger.info("Sending request to NVIDIA API at %s/chat/completions ...", config.base_url)
    try:
        response = client.post("/chat/completions", json=payload, timeout=AI_REQUEST_TIMEOUT)
        logger.info("NVIDIA API responded with status=%s in %s", response.status_code, response.elapsed.total_seconds() if hasattr(response, 'elapsed') else '?')
    except httpx.TimeoutException:
        logger.error("NVIDIA API timed out after %ss", AI_REQUEST_TIMEOUT)
        raise RuntimeError(f"NVIDIA API did not respond within {int(AI_REQUEST_TIMEOUT)}s. Please try again.")
    except httpx.RequestError as exc:
        logger.error("NVIDIA API request failed: %s", exc)
        raise RuntimeError(f"NVIDIA API request failed: {exc}")

    if response.status_code == 401:
        logger.error("NVIDIA API returned 401 — invalid API key")
        raise RuntimeError("Invalid NVIDIA API key. Check your NVIDIA_API_KEY.")
    if response.status_code == 404:
        logger.error("NVIDIA API returned 404 — model '%s' not found", config.model)
        raise RuntimeError(f"Model '{config.model}' not found or not accessible.")
    if response.status_code == 429:
        logger.error("NVIDIA API returned 429 — rate limited")
        raise RuntimeError("Rate limited by NVIDIA API. Please wait and try again.")
    if response.status_code != 200:
        body = response.text[:500]
        logger.error("NVIDIA API returned %s: %s", response.status_code, body)
        raise RuntimeError(f"NVIDIA API error {response.status_code}: {body}")

    result = response.json()
    choices = result.get("choices", [])
    if not choices:
        logger.error("NVIDIA API returned empty choices array: %s", result)
        raise RuntimeError("NVIDIA API returned empty response.")

    content = choices[0].get("message", {}).get("content", "")
    if not content:
        logger.error("NVIDIA API returned empty message content in first choice")
        raise RuntimeError("NVIDIA API returned empty message content.")

    content = content.strip()
    logger.info("AI response received: %d chars", len(content))

    if content.startswith("```"):
        content = content.strip("`")
        if content.startswith("json"):
            content = content[4:]
        content = content.strip()

    try:
        parsed = json.loads(content)
        logger.info("AI response parsed as JSON with top-level keys: %s", list(parsed.keys()))
        return parsed
    except json.JSONDecodeError as exc:
        logger.warning("AI response was not valid JSON: %s. Raw content (first 200): %s", exc, content[:200])
        return {"raw_response": content}


# ── Legacy heuristic functions (kept for backward compat with old endpoints) ──

def placement_prediction(student: Student) -> dict:
    score = round((student.cgpa * 7) + (student.attendance_percentage * 0.12) + (student.skill_score * 0.28), 1)
    return {
        "score": min(score, 98),
        "result": "High placement readiness" if score >= 75 else "Needs focused preparation",
        "explanation": "Prediction combines academics, attendance, skills, and readiness trend signals.",
    }


def risk_prediction(student: Student) -> dict:
    return {
        "score": student.risk_score,
        "result": "Low risk" if student.risk_score < 35 else "Intervention recommended",
        "explanation": "Risk score uses attendance, performance drift, and skill completion momentum.",
    }


def skill_gap(student: Student) -> dict:
    return {
        "gaps": [
            {"skill": "System Design", "current": 48, "target": 75},
            {"skill": "Python ML", "current": 66, "target": 82},
            {"skill": "Communication", "current": 70, "target": 85},
        ],
        "summary": "Student is strongest in core programming and should prioritize interview communication.",
    }


def resume_analysis() -> dict:
    return {
        "score": 82,
        "strengths": ["Clear project impact", "Strong technical keywords", "Readable structure"],
        "improvements": ["Quantify internship outcomes", "Add leadership evidence", "Tighten summary"],
    }


def career_recommendation() -> dict:
    return {
        "tracks": ["AI Engineer", "Backend Developer", "Data Analyst"],
        "next_steps": ["Build one deployed ML app", "Practice SQL case studies", "Complete mock interviews"],
    }


def learning_roadmap() -> dict:
    return {
        "title": "8-week placement acceleration plan",
        "milestones": ["DSA refresh", "Resume polish", "Aptitude sprint", "Mock interview loop"],
    }


def assistant_reply(message: str) -> dict:
    return {"reply": f"Recommended next action: turn '{message}' into a measurable weekly goal and review it with your mentor."}
