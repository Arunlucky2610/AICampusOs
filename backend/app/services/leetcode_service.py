import json
import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"

_USER_PROFILE_QUERY = """
query userProfile($username: String!) {
  matchedUser(username: $username) {
    username
    submitStats {
      acSubmissionNum {
        difficulty
        count
        submissions
      }
      totalSubmissionNum {
        difficulty
        count
        submissions
      }
    }
    profile {
      ranking
      reputation
      starRating
    }
    submissionCalendar
  }
  userContestRanking(username: $username) {
    attendedContestsCount
    rating
    globalRanking
    totalParticipants
    topPercentage
  }
}
"""

_TOPIC_TAGS_QUERY = """
query skillStats($username: String!) {
  matchedUser(username: $username) {
    tagProblemCounts {
      advanced {
        tagName
        problemsSolved
      }
      intermediate {
        tagName
        problemsSolved
      }
      fundamental {
        tagName
        problemsSolved
      }
    }
  }
}
"""


def extract_leetcode_username(url: Optional[str]) -> Optional[str]:
    if not url or not url.strip():
        return None
    url = url.rstrip("/")
    if "/u/" in url:
        return url.split("/u/")[-1]
    parts = url.split("/")
    for i, part in enumerate(parts):
        if part in ("u", "profile", "leetcode.com") and i + 1 < len(parts):
            candidate = parts[i + 1]
            if candidate and candidate != "u" and "?" not in candidate:
                return candidate.split("?")[0]
    return parts[-1] if parts[-1] else None


def fetch_leetcode_stats(username: str) -> dict:
    result: dict = {"username": username}

    try:
        profile_data = _graphql_request(_USER_PROFILE_QUERY, {"username": username})
    except Exception as exc:
        logger.warning("LeetCode profile fetch failed for %s: %s", username, exc)
        result["error"] = "API_ERROR"
        result["error_detail"] = str(exc)
        return result

    matched = profile_data.get("data", {}).get("matchedUser")
    if not matched:
        logger.warning("LeetCode user not found: %s", username)
        result["error"] = "USER_NOT_FOUND"
        return result

    ac_submissions = matched.get("submitStats", {}).get("acSubmissionNum", [])
    total_submissions = matched.get("submitStats", {}).get("totalSubmissionNum", [])

    difficulty_map = {"All": "total", "Easy": "easy", "Medium": "medium", "Hard": "hard"}
    for entry in ac_submissions:
        key = difficulty_map.get(entry.get("difficulty", ""))
        if key:
            result[f"{key}_solved"] = entry.get("count", 0)

    for entry in total_submissions:
        key = difficulty_map.get(entry.get("difficulty", ""))
        if key:
            result[f"{key}_total_attempted"] = entry.get("count", 0)
            result[f"{key}_total_submissions"] = entry.get("submissions", 0)

    total_solved = result.get("total_solved", 0)
    total_attempted = result.get("total_attempted", 0)
    result["acceptance_rate"] = round(
        (total_solved / total_attempted * 100) if total_attempted else 0, 1
    )

    profile = matched.get("profile", {})
    result["ranking"] = profile.get("ranking")
    result["reputation"] = profile.get("reputation")
    result["star_rating"] = profile.get("starRating")

    contest = profile_data.get("data", {}).get("userContestRanking", {})
    if contest and contest.get("rating"):
        result["contest_rating"] = round(contest["rating"], 1)
        result["contest_attended"] = contest.get("attendedContestsCount", 0)
        result["contest_global_ranking"] = contest.get("globalRanking")
        result["contest_top_percentage"] = contest.get("topPercentage")

    submission_calendar = matched.get("submissionCalendar")
    if submission_calendar:
        try:
            cal = json.loads(submission_calendar)
            days_active = sum(1 for v in cal.values() if v > 0)
            result["days_active"] = days_active
            result["total_days"] = len(cal)
            result["consistency_pct"] = round(
                (days_active / len(cal) * 100) if cal else 0, 1
            )
        except (json.JSONDecodeError, TypeError):
            pass

    try:
        topic_data = _graphql_request(_TOPIC_TAGS_QUERY, {"username": username})
        tag_counts = topic_data.get("data", {}).get("matchedUser", {}).get("tagProblemCounts", {})
        result["topics"] = _parse_topic_tags(tag_counts)
    except Exception as exc:
        logger.info("LeetCode topic fetch failed (non-fatal): %s", exc)
        result["topics"] = {}

    return result


def _graphql_request(query: str, variables: dict) -> dict:
    with httpx.Client(timeout=15.0) as client:
        resp = client.post(
            LEETCODE_GRAPHQL_URL,
            json={"query": query, "variables": variables},
            headers={"Content-Type": "application/json"},
        )
        resp.raise_for_status()
        return resp.json()


def _parse_topic_tags(tag_counts: dict) -> dict:
    topics = {}
    for level in ("advanced", "intermediate", "fundamental"):
        for tag in tag_counts.get(level, []):
            name = tag.get("tagName", "unknown")
            solved = tag.get("problemsSolved", 0)
            if name not in topics:
                topics[name] = {"solved": 0, "level": level}
            topics[name]["solved"] += solved
    return topics
