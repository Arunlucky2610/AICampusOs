import logging
import re
from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User
from app.services.ai_cache import get_ai_cache
from app.services.ai_prompts import get_prompt, PROMPT_TEMPLATES
from app.services.ai_service import run_ai
from app.services.context_builder import build_context

logger = logging.getLogger(__name__)

_STUDENT_MODULES = {
    "academic_mentor", "career_copilot", "placement_ai", "mock_interview",
    "ai_tutor", "coding_analyzer", "github_analyzer", "github_project_analyzer",
    "leetcode_analyzer", "linkedin_analyzer", "resume_analyzer", "student_report",
}

_FACULTY_MODULES = {"faculty_summary"}

_PARENT_MODULES = {"parent_summary"}


class AIRouter:
    def __init__(self, module_type: str, db: Session, user: User):
        self.module_type = module_type
        self.db = db
        self.user = user

    def execute(self) -> dict:
        prompt = get_prompt(self.module_type)
        context = build_context(self.db, self.user, self.module_type)

        if self.module_type in _STUDENT_MODULES:
            if "student" not in context:
                raise ValueError(
                    "This module requires a student profile. "
                    "No student data found for your account."
                )

        if self.module_type == "github_project_analyzer":
            gh = context.get("github")
            if gh and "missingData" in gh:
                raise ValueError(
                    "GitHub URL not set in your profile. "
                    "Please add your GitHub profile URL to enable project analysis."
                )

        if self.module_type == "resume_analyzer":
            res = context.get("resume")
            if res and "missingData" in res:
                raise ValueError(
                    "No resume found in your profile. "
                    "Please upload your resume first via POST /api/student/resume/upload."
                )

        if self.module_type == "leetcode_analyzer":
            lc = context.get("leetcode")
            if lc and "missingData" in lc:
                raise ValueError(
                    "LeetCode URL not set in your profile. "
                    "Please add your LeetCode profile URL to enable analysis."
                )
            if lc and lc.get("error") == "API_ERROR":
                raise RuntimeError(
                    "LeetCode API is currently unavailable. "
                    "Please try again later."
                )
            if lc and lc.get("error") == "USER_NOT_FOUND":
                raise ValueError(
                    "LeetCode user not found. "
                    "Please verify your LeetCode profile URL is correct."
                )

        flattened = self._flatten(context)
        system_prompt = prompt["system_prompt"]
        user_prompt = self._safe_format(prompt["user_prompt_template"], flattened)

        result = run_ai(system_prompt, user_prompt)
        result["_module_type"] = self.module_type
        result["_context_used"] = self._summarize_context(context)

        cache = get_ai_cache()
        cache.set(self.user.id, self.module_type, result)

        return result

    def execute_raw(self, system_prompt: str, user_prompt: str) -> dict:
        result = run_ai(system_prompt, user_prompt)
        cache = get_ai_cache()
        cache.set(self.user.id, self.module_type, result)
        return result

    def _safe_format(self, template: str, values: dict) -> str:
        def replace(match: re.Match) -> str:
            key = match.group(1)
            val = values.get(key)
            if val is None:
                return ""
            return str(val)
        return re.sub(r"\{(\w+)\}", replace, template)

    def _flatten(self, data: dict, parent_key: str = "") -> dict:
        items = {}
        for key, value in data.items():
            new_key = f"{parent_key}_{key}" if parent_key else key
            if isinstance(value, dict):
                items.update(self._flatten(value, new_key))
            elif isinstance(value, list):
                items[new_key] = str(value) if value else ""
            elif value is None:
                items[new_key] = ""
            else:
                items[new_key] = value
        return items

    def _summarize_context(self, context: dict) -> dict:
        summary = {}
        if "student" in context:
            s = context["student"]
            summary["student_info"] = {
                "name": s.get("name"),
                "department": s.get("department"),
                "year": s.get("year"),
            }
        if "coding" in context:
            c = context["coding"]
            summary["coding"] = {
                "github": bool(c.get("github_stats")),
                "leetcode": bool(c.get("leetcode_stats")),
            }
        if "github" in context:
            g = context["github"]
            summary["github"] = {
                "username": g.get("username"),
                "repos_count": g.get("repos_count", 0),
                "total_stars": g.get("total_stars", 0),
                "has_error": bool(g.get("error")),
                "missing_url": "missingData" in g,
            }
        if "resume" in context:
            r = context["resume"]
            summary["resume"] = {
                "has_text": bool(r.get("text")),
                "text_length": len(r.get("text") or ""),
                "file_url": r.get("file_url"),
                "missing_resume": "missingData" in r,
            }
        if "leetcode" in context:
            l = context["leetcode"]
            summary["leetcode"] = {
                "username": l.get("username"),
                "total_solved": l.get("total_solved", 0),
                "contest_rating": l.get("contest_rating"),
                "has_error": bool(l.get("error")),
                "missing_url": "leetcode_url" in (l.get("missingData") or []),
            }
        if "placement" in context:
            p = context["placement"]
            summary["placement"] = {
                "missing_data_count": len(p.get("missingData") or []),
                "missing_data": p.get("missingData", []),
            }
        return summary


def get_latest_result(user_id: int, module_type: str) -> Optional[dict]:
    cache = get_ai_cache()
    return cache.get_latest(user_id, module_type)
