from datetime import datetime
from typing import Any

from pydantic import BaseModel


class LeetCodeStats(BaseModel):
    total_solved: int = 0
    easy_solved: int = 0
    medium_solved: int = 0
    hard_solved: int = 0
    ranking: int | None = None
    contest_rating: int | None = None
    reputation: int | None = None
    recent_submissions: list[dict[str, Any]] = []


class GitHubStats(BaseModel):
    public_repos: int = 0
    followers: int = 0
    following: int = 0
    recent_repos: list[dict[str, Any]] = []
    recent_activity_count: int = 0
    last_active_date: str | None = None
    languages: dict[str, int] = {}
    profile_url: str | None = None
    avatar_url: str | None = None


class LinkedInStatus(BaseModel):
    connected: bool = False
    url: str | None = None


class LinkedInProfileInfo(BaseModel):
    username: str | None = None
    headline: str | None = None
    about: str | None = None
    skills: str | None = None
    open_to_work: bool = False
    profile_strength: int = 0


class CodingProgressResponse(BaseModel):
    github_url: str | None = None
    leetcode_url: str | None = None
    linkedin_url: str | None = None
    github_username: str | None = None
    leetcode_username: str | None = None
    github_stats: GitHubStats | None = None
    leetcode_stats: LeetCodeStats | None = None
    linkedin_status: LinkedInStatus | None = None
    linkedin_profile: LinkedInProfileInfo | None = None
    coding_score: float = 0.0
    placement_readiness_score: float = 0.0
    last_synced_at: str | None = None


class CodingProgressSyncResponse(BaseModel):
    success: bool
    message: str
    data: CodingProgressResponse | None = None


class CodingSummary(BaseModel):
    leetcode_total_solved: int = 0
    github_public_repos: int = 0
    github_recent_activity: int = 0
    coding_score: float = 0.0
    placement_readiness_score: float = 0.0
    last_synced_at: str | None = None
