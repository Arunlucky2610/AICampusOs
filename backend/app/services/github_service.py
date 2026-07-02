import logging
import re
from typing import Optional

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

GITHUB_API_BASE = "https://api.github.com"


def extract_github_username(url: Optional[str]) -> Optional[str]:
    if not url or not url.strip():
        return None
    url = url.strip()
    m = re.match(r"https?://github\.com/([a-zA-Z0-9._-]+)/?$", url)
    if m:
        return m.group(1)
    m = re.match(r"https?://github\.com/([a-zA-Z0-9._-]+)/?.*", url)
    if m:
        return m.group(1)
    return None


def _headers() -> dict:
    headers = {"Accept": "application/vnd.github.v3+json"}
    token = get_settings().github_token
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def fetch_github_projects(username: str) -> dict:
    result = {
        "username": username,
        "profile": {},
        "repos": [],
        "languages": {},
        "total_stars": 0,
        "total_forks": 0,
        "recent_commits": [],
        "readmes": {},
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            user_resp = client.get(
                f"{GITHUB_API_BASE}/users/{username}", headers=_headers()
            )
            if user_resp.status_code == 404:
                logger.warning("GitHub user %s not found", username)
                result["error"] = "USER_NOT_FOUND"
                return result
            if user_resp.status_code == 403:
                logger.warning("GitHub API rate limited for %s", username)
                result["error"] = "RATE_LIMITED"
                return result
            if user_resp.status_code != 200:
                logger.warning(
                    "GitHub user API returned %s for %s",
                    user_resp.status_code,
                    username,
                )
                result["error"] = f"API_ERROR_{user_resp.status_code}"
                return result

            user_data = user_resp.json()
            result["profile"] = {
                "name": user_data.get("name"),
                "bio": user_data.get("bio"),
                "public_repos": user_data.get("public_repos", 0),
                "followers": user_data.get("followers", 0),
                "following": user_data.get("following", 0),
                "created_at": user_data.get("created_at"),
                "avatar_url": user_data.get("avatar_url"),
                "html_url": user_data.get("html_url"),
                "company": user_data.get("company"),
                "location": user_data.get("location"),
                "blog": user_data.get("blog"),
                "twitter_username": user_data.get("twitter_username"),
            }

            repos_resp = client.get(
                f"{GITHUB_API_BASE}/users/{username}/repos",
                params={"sort": "updated", "per_page": 20, "type": "owner"},
                headers=_headers(),
            )
            if repos_resp.status_code == 200:
                repos = repos_resp.json()
                for r in repos:
                    repo_info = {
                        "name": r.get("name"),
                        "full_name": r.get("full_name"),
                        "description": r.get("description"),
                        "language": r.get("language"),
                        "stars": r.get("stargazers_count", 0),
                        "forks": r.get("forks_count", 0),
                        "open_issues": r.get("open_issues_count", 0),
                        "size": r.get("size", 0),
                        "topics": r.get("topics", []),
                        "created_at": r.get("created_at"),
                        "updated_at": r.get("updated_at"),
                        "pushed_at": r.get("pushed_at"),
                        "html_url": r.get("html_url"),
                        "has_readme": False,
                        "languages": {},
                        "readme_preview": None,
                    }
                    result["total_stars"] += r.get("stargazers_count", 0)
                    result["total_forks"] += r.get("forks_count", 0)

                    lang_resp = client.get(
                        f"{GITHUB_API_BASE}/repos/{r['full_name']}/languages",
                        headers=_headers(),
                    )
                    if lang_resp.status_code == 200:
                        repo_info["languages"] = lang_resp.json()
                        for lang, bytes_count in lang_resp.json().items():
                            result["languages"][lang] = (
                                result["languages"].get(lang, 0) + bytes_count
                            )

                    if r.get("stargazers_count", 0) > 0 or r.get("fork", False) is False:
                        readme_resp = client.get(
                            f"{GITHUB_API_BASE}/repos/{r['full_name']}/readme",
                            headers={
                                **_headers(),
                                "Accept": "application/vnd.github.v3.raw",
                            },
                        )
                        if readme_resp.status_code == 200:
                            repo_info["has_readme"] = True
                            text = readme_resp.text[:2000]
                            repo_info["readme_preview"] = text
                            result["readmes"][r["name"]] = text

                    result["repos"].append(repo_info)

            events_resp = client.get(
                f"{GITHUB_API_BASE}/users/{username}/events/public",
                params={"per_page": 30},
                headers=_headers(),
            )
            if events_resp.status_code == 200:
                events = events_resp.json()
                for ev in events:
                    ev_type = ev.get("type", "")
                    if ev_type in ("PushEvent", "CreateEvent", "PullRequestEvent", "IssuesEvent"):
                        repo_name = None
                        if ev.get("repo"):
                            repo_name = ev["repo"].get("name")
                        result["recent_commits"].append({
                            "type": ev_type,
                            "repo": repo_name,
                            "created_at": ev.get("created_at"),
                            "actor": ev.get("actor", {}).get("login"),
                        })

    except httpx.TimeoutException:
        logger.error("GitHub API timed out for %s", username)
        result["error"] = "TIMEOUT"
    except httpx.RequestError as exc:
        logger.error("GitHub API request failed for %s: %s", username, exc)
        result["error"] = "REQUEST_FAILED"
    except Exception as exc:
        logger.error("Unexpected error fetching GitHub data for %s: %s", username, exc)
        result["error"] = "UNEXPECTED_ERROR"

    return result
