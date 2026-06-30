import logging
import re
from datetime import datetime

import httpx

logger = logging.getLogger(__name__)

GITHUB_API_BASE = "https://api.github.com"
LEETCODE_GRAPHQL = "https://leetcode.com/graphql"

LEETCODE_QUERY = """
query userPublicProfile($username: String!) {
  matchedUser(username: $username) {
    username
    submitStats: submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
    profile {
      ranking
      reputation
    }
  }
}
"""

LEETCODE_RECENT_QUERY = """
query recentSubmissions($username: String!, $limit: Int!) {
  recentSubmissionList(username: $username, limit: $limit) {
    title
    titleSlug
    timestamp
    statusDisplay
    lang
  }
}
"""


def extract_github_username(url: str | None) -> str | None:
    if not url:
        return None
    m = re.match(r"https?://github\.com/([a-zA-Z0-9_-]+)/?$", url.strip())
    return m.group(1) if m else None


def extract_leetcode_username(url: str | None) -> str | None:
    if not url:
        return None
    m = re.match(r"https?://leetcode\.com/(?:u/)?([a-zA-Z0-9_-]+)/?$", url.strip())
    return m.group(1) if m else None


def fetch_github_stats(username: str) -> dict:
    stats = {
        "public_repos": 0,
        "followers": 0,
        "following": 0,
        "recent_repos": [],
        "recent_activity_count": 0,
        "last_active_date": None,
        "languages": {},
        "profile_url": None,
        "avatar_url": None,
    }
    try:
        with httpx.Client(timeout=15) as client:
            user_resp = client.get(f"{GITHUB_API_BASE}/users/{username}")
            if user_resp.status_code == 200:
                user_data = user_resp.json()
                stats["public_repos"] = user_data.get("public_repos", 0)
                stats["followers"] = user_data.get("followers", 0)
                stats["following"] = user_data.get("following", 0)
                stats["profile_url"] = user_data.get("html_url")
                stats["avatar_url"] = user_data.get("avatar_url")

            repos_resp = client.get(
                f"{GITHUB_API_BASE}/users/{username}/repos",
                params={"sort": "updated", "per_page": 10},
            )
            if repos_resp.status_code == 200:
                repos = repos_resp.json()
                stats["recent_repos"] = [
                    {
                        "name": r.get("name"),
                        "description": r.get("description"),
                        "language": r.get("language"),
                        "stars": r.get("stargazers_count", 0),
                        "forks": r.get("forks_count", 0),
                        "updated_at": r.get("updated_at"),
                        "html_url": r.get("html_url"),
                    }
                    for r in repos
                ]
                lang_counts: dict[str, int] = {}
                for r in repos:
                    lang = r.get("language")
                    if lang:
                        lang_counts[lang] = lang_counts.get(lang, 0) + 1
                stats["languages"] = lang_counts

            events_resp = client.get(
                f"{GITHUB_API_BASE}/users/{username}/events/public",
                params={"per_page": 20},
            )
            if events_resp.status_code == 200:
                events = events_resp.json()
                stats["recent_activity_count"] = len(events)
                if events:
                    last_event = events[0]
                    stats["last_active_date"] = last_event.get("created_at")
            elif events_resp.status_code == 202:
                logger.info("GitHub events not yet ready for %s (202 accepted)", username)

            if user_resp.status_code == 403:
                logger.warning("GitHub API rate limit hit for %s", username)
            elif user_resp.status_code == 404:
                logger.warning("GitHub user %s not found", username)
    except httpx.RequestError as e:
        logger.error("GitHub API request failed for %s: %s", username, str(e))
    except Exception as e:
        logger.error("Unexpected error fetching GitHub stats for %s: %s", username, str(e))

    return stats


def fetch_leetcode_stats(username: str) -> dict:
    stats = {
        "total_solved": 0,
        "easy_solved": 0,
        "medium_solved": 0,
        "hard_solved": 0,
        "ranking": None,
        "contest_rating": None,
        "reputation": None,
        "recent_submissions": [],
    }
    try:
        with httpx.Client(timeout=15) as client:
            resp = client.post(
                LEETCODE_GRAPHQL,
                json={"query": LEETCODE_QUERY, "variables": {"username": username}},
            )
            if resp.status_code == 200:
                data = resp.json()
                matched = data.get("data", {}).get("matchedUser")
                if matched:
                    submit_stats = matched.get("submitStats", {})
                    ac_list = submit_stats.get("acSubmissionNum", [])
                    for item in ac_list:
                        diff = item.get("difficulty", "").lower()
                        count = item.get("count", 0)
                        if diff == "all":
                            stats["total_solved"] = count
                        elif diff == "easy":
                            stats["easy_solved"] = count
                        elif diff == "medium":
                            stats["medium_solved"] = count
                        elif diff == "hard":
                            stats["hard_solved"] = count
                    profile = matched.get("profile", {})
                    stats["ranking"] = profile.get("ranking")
                    stats["reputation"] = profile.get("reputation")

            recent_resp = client.post(
                LEETCODE_GRAPHQL,
                json={
                    "query": LEETCODE_RECENT_QUERY,
                    "variables": {"username": username, "limit": 10},
                },
            )
            if recent_resp.status_code == 200:
                recent_data = recent_resp.json()
                submissions = recent_data.get("data", {}).get("recentSubmissionList", [])
                stats["recent_submissions"] = [
                    {
                        "title": s.get("title"),
                        "title_slug": s.get("titleSlug"),
                        "timestamp": s.get("timestamp"),
                        "status": s.get("statusDisplay"),
                        "lang": s.get("lang"),
                    }
                    for s in submissions
                ]

            if resp.status_code == 404:
                logger.warning("LeetCode user %s not found", username)
    except httpx.RequestError as e:
        logger.error("LeetCode API request failed for %s: %s", username, str(e))
    except Exception as e:
        logger.error("Unexpected error fetching LeetCode stats for %s: %s", username, str(e))

    return stats


def calculate_coding_score(leetcode_stats: dict, github_stats: dict, has_linkedin: bool) -> float:
    total_solved = leetcode_stats.get("total_solved", 0)
    if total_solved < 50:
        lc_score = 20
    elif total_solved < 150:
        lc_score = 40
    elif total_solved < 300:
        lc_score = 60
    elif total_solved < 500:
        lc_score = 80
    else:
        lc_score = 100

    gh_repos = github_stats.get("public_repos", 0)
    gh_activity = github_stats.get("recent_activity_count", 0)
    gh_repo_score = min(gh_repos * 5, 40)
    gh_activity_score = min(gh_activity * 2, 30)
    gh_score = gh_repo_score + gh_activity_score

    li_bonus = 10 if has_linkedin else 0

    raw = (lc_score * 0.45) + (gh_score * 0.35) + li_bonus
    return round(min(raw, 100), 1)


def calculate_placement_readiness(
    lc_total: int,
    coding_score: float,
    resume_score: float | None,
    profile_completion: float,
    linkedin_strength: int = 0,
) -> float:
    lc_bonus = min(lc_total / 10, 20)
    li_bonus = linkedin_strength * 0.05
    readiness = (coding_score * 0.35) + (resume_score or 0) * 0.25 + profile_completion * 0.2 + lc_bonus + li_bonus
    return round(min(readiness, 100), 1)
