import json
import logging
import time
from typing import Optional

import httpx

from app.core.ai_config import get_ai_client_config, validate_ai_configuration
from app.models.student import Student

logger = logging.getLogger(__name__)

_client: Optional[httpx.Client] = None


AI_REQUEST_TIMEOUT = 240.0
MAX_RETRIES = 2


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

    last_error: Optional[str] = None
    for attempt in range(1 + MAX_RETRIES):
        if attempt > 0:
            wait = attempt * 2
            logger.info("Retry attempt %d/%d after %ds...", attempt, MAX_RETRIES, wait)
            time.sleep(wait)

        try:
            logger.info("Sending request to NVIDIA API at %s/chat/completions (attempt %d)...", config.base_url, attempt + 1)
            response = client.post("/chat/completions", json=payload, timeout=AI_REQUEST_TIMEOUT)
            elapsed = response.elapsed.total_seconds() if hasattr(response, 'elapsed') else '?'
            logger.info("NVIDIA API responded with status=%s in %s", response.status_code, elapsed)
        except httpx.TimeoutException:
            logger.error("NVIDIA API timed out after %ss (attempt %d)", AI_REQUEST_TIMEOUT, attempt + 1)
            last_error = "The AI service is temporarily slow. Please try again."
            continue
        except httpx.RequestError as exc:
            logger.error("NVIDIA API request failed (attempt %d): %s", attempt + 1, exc)
            last_error = "The AI service encountered a network issue. Please try again."
            continue

        if response.status_code == 401:
            logger.error("NVIDIA API returned 401 — invalid API key")
            return _fallback_response("AI service configuration error. Please contact support.")
        if response.status_code == 404:
            logger.error("NVIDIA API returned 404 — model '%s' not found", config.model)
            return _fallback_response("AI model not found. Please contact support.")
        if response.status_code == 429:
            logger.warning("NVIDIA API returned 429 — rate limited (attempt %d), retrying...", attempt + 1)
            last_error = "AI service is busy. Please try again."
            continue
        if response.status_code == 502 or response.status_code == 503:
            logger.warning("NVIDIA API returned %s (attempt %d), retrying...", response.status_code, attempt + 1)
            last_error = "AI service temporarily unavailable. Please try again."
            continue
        if response.status_code != 200:
            body = response.text[:500]
            logger.error("NVIDIA API returned %s: %s", response.status_code, body)
            last_error = "AI service returned an unexpected response. Please try again."
            continue

        result = response.json()
        choices = result.get("choices", [])
        if not choices:
            logger.error("NVIDIA API returned empty choices array: %s", result)
            last_error = "AI service returned an empty response. Please try again."
            continue

        content = choices[0].get("message", {}).get("content", "")
        if not content:
            logger.error("NVIDIA API returned empty message content in first choice")
            last_error = "AI service returned an empty response. Please try again."
            continue

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
            logger.warning("AI response was not valid JSON: %s. Raw content (first 400): %s", exc, content[:400])
            return _fallback_response("Analysis generated unstructured output. Please try again.")

    logger.error("All %d attempts to NVIDIA API failed. Last error: %s", 1 + MAX_RETRIES, last_error)
    return _fallback_response(last_error or "AI service temporarily unavailable. Please try again later.")


def _fallback_response(message: str) -> dict:
    return {
        "atsScore": 0,
        "resumeStrengthScore": 0,
        "skillsMatch": 0,
        "projectImpact": 0,
        "experienceQuality": 0,
        "missingKeywords": [],
        "weakSections": [],
        "corrections": [],
        "improvedSummary": "",
        "strengths": [],
        "weaknesses": [],
        "evidenceFromData": [],
        "exactWeakAreas": [],
        "improvementPlan": [],
        "nextActions": [],
        "missingData": [],
        "error": message,
        "error_type": "service_unavailable",
    }


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
