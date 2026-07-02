import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.models.coding_progress import CodingProgressCache
from app.models.faculty import FacultyProfile
from app.models.parent import ParentProfile
from app.models.placement import PlacementProfile
from app.models.student import Student
from app.models.user import User
from app.services.github_service import extract_github_username, fetch_github_projects
from app.services.leetcode_service import extract_leetcode_username, fetch_leetcode_stats

logger = logging.getLogger(__name__)


class ContextBuilder:
    def __init__(self, db: Session):
        self.db = db

    def for_student(self, user: User) -> Optional[dict]:
        student = self.db.query(Student).filter(Student.user_id == user.id).first()
        if not student:
            if user.role.value == "STUDENT":
                raise ValueError(f"Student profile not found for user {user.id}")
            return None
        return self._student_to_dict(student)

    def _student_to_dict(self, s: Student) -> dict:
        return {
            "id": s.id,
            "roll_number": s.roll_number,
            "name": s.user.full_name if s.user else None,
            "department": s.department,
            "course": s.course,
            "branch": s.branch,
            "section": s.section,
            "year": s.year,
            "semester": s.semester,
            "academic_year": s.academic_year,
            "cgpa": s.cgpa,
            "current_semester_gpa": s.current_semester_gpa,
            "attendance_percentage": s.attendance_percentage,
            "credits_earned": s.credits_earned,
            "total_credits": s.total_credits,
            "placement_readiness_score": s.placement_readiness_score,
            "risk_score": s.risk_score,
            "skill_score": s.skill_score,
            "resume_score": s.resume_score,
            "coding_score": s.coding_score,
            "mock_interview_score": s.mock_interview_score,
            "communication_score": s.communication_score,
            "applications": s.applications,
            "eligible_companies": s.eligible_companies,
            "offers": s.offers,
            "preferred_role": s.preferred_role,
            "expected_package": s.expected_package,
            "semester_gpas": s.semester_gpas or [],
            "subjects_data": s.subjects_data or [],
            "skills_data": s.skills_data or {},
            "certifications": s.certifications or [],
            "eligible_companies_list": s.eligible_companies_list or [],
            "github_url": s.github_url,
            "linkedin_url": s.linkedin_url,
            "leetcode_url": s.leetcode_url,
            "portfolio_url": s.portfolio_url,
            "resume_url": s.resume_url,
            "github_username": self._extract_username(s.github_url),
            "leetcode_username": self._extract_username(s.leetcode_url),
            "linkedin_data": {
                "headline": s.linkedin_headline,
                "about": s.linkedin_about,
                "skills": s.linkedin_skills,
                "open_to_work": bool(s.linkedin_open_to_work),
            },
        }

    def for_coding(self, user: User) -> Optional[dict]:
        cache = self.db.query(CodingProgressCache).filter(
            CodingProgressCache.user_id == user.id
        ).first()
        if not cache:
            return None
        return {
            "github_username": cache.github_username,
            "leetcode_username": cache.leetcode_username,
            "github_stats": cache.github_stats_json or {},
            "leetcode_stats": cache.leetcode_stats_json or {},
            "linkedin_status": cache.linkedin_status_json or {},
            "coding_score": cache.coding_score,
            "placement_readiness_score": cache.placement_readiness_score,
            "last_synced_at": (
                cache.last_synced_at.isoformat() if cache.last_synced_at else None
            ),
        }

    def for_faculty(self, user: User) -> Optional[dict]:
        faculty = self.db.query(FacultyProfile).filter(
            FacultyProfile.user_id == user.id
        ).first()
        if not faculty:
            return None
        student_query = self.db.query(Student).filter(
            Student.department == faculty.department
        )
        all_students = student_query.all()
        total = len(all_students)
        avg_cgpa = (
            sum(s.cgpa or 0 for s in all_students) / total if total else 0
        )
        avg_attendance = (
            sum(s.attendance_percentage or 0 for s in all_students) / total
            if total
            else 0
        )
        at_risk = sum(1 for s in all_students if (s.risk_score or 0) > 35)
        return {
            "faculty_name": user.full_name,
            "department": faculty.department,
            "designation": faculty.designation,
            "employee_id": faculty.employee_id,
            "student_count": total,
            "avg_cgpa": round(avg_cgpa, 2),
            "avg_attendance": round(avg_attendance, 2),
            "at_risk_count": at_risk,
        }

    def for_parent(self, user: User) -> Optional[dict]:
        parent = self.db.query(ParentProfile).filter(
            ParentProfile.user_id == user.id
        ).first()
        if not parent:
            return None
        student = self.db.query(Student).filter(
            Student.id == parent.student_id
        ).first()
        if not student:
            return None
        context = self._student_to_dict(student)
        context["relation"] = parent.relation
        return context

    def for_placement_officer(self, user: User) -> Optional[dict]:
        profile = self.db.query(PlacementProfile).filter(
            PlacementProfile.user_id == user.id
        ).first()
        if not profile:
            return None
        all_students = self.db.query(Student).all()
        total = len(all_students)
        placed = sum(1 for s in all_students if (s.offers or 0) > 0)
        avg_coding = (
            sum(s.coding_score or 0 for s in all_students) / total if total else 0
        )
        return {
            "officer_name": user.full_name,
            "department": profile.department,
            "total_students": total,
            "placed_students": placed,
            "avg_coding_score": round(avg_coding, 2),
        }

    def for_github_projects(self, user: User) -> Optional[dict]:
        student = self.db.query(Student).filter(Student.user_id == user.id).first()
        if not student:
            return None

        github_url = student.github_url
        if not github_url or not github_url.strip():
            return {"missingData": ["github_url"]}

        username = extract_github_username(github_url)
        if not username:
            return {"missingData": ["github_url"], "error": "Could not extract username from URL"}

        data = fetch_github_projects(username)
        data["github_url"] = github_url

        repos = data.get("repos", [])
        data["repos_count"] = len(repos)
        data["repos_summary"] = "\n".join(
            f"  - {r['name']}: {(r.get('description') or 'No description')[:100]} "
            f"(stars={r['stars']}, forks={r['forks']}, lang={r.get('language') or 'N/A'})"
            for r in repos[:10]
        )

        langs = data.get("languages") or {}
        total_bytes = sum(langs.values()) or 1
        lang_pct = sorted(
            ((lang, round(bytes_count / total_bytes * 100, 1))
             for lang, bytes_count in langs.items()),
            key=lambda x: -x[1],
        )
        data["languages_summary"] = ", ".join(
            f"{lang} ({pct}%)" for lang, pct in lang_pct[:8]
        )

        commits = data.get("recent_commits") or []
        data["commits_count"] = len(commits)
        data["commits_summary"] = "\n".join(
            f"  - [{c['type']}] {(c.get('repo') or 'unknown')} at {(c.get('created_at') or '?')}"
            for c in commits[:15]
        )

        readmes = data.get("readmes", {})
        data["readme_summary"] = "\n---\n".join(
            f"README for {repo_name}:\n{text[:500]}"
            for repo_name, text in list(readmes.items())[:5]
        ) if readmes else "No README files found."

        return data

    def for_resume(self, user: User) -> Optional[dict]:
        student = self.db.query(Student).filter(Student.user_id == user.id).first()
        if not student:
            return None

        resume_text = student.resume_text
        if not resume_text or not resume_text.strip():
            return {"missingData": ["resume"]}

        return {
            "text": resume_text,
            "file_url": student.resume_url,
            "resume_score": student.resume_score,
        }

    def for_leetcode(self, user: User) -> Optional[dict]:
        student = self.db.query(Student).filter(Student.user_id == user.id).first()
        if not student:
            return None

        leetcode_url = student.leetcode_url
        if not leetcode_url or not leetcode_url.strip():
            return {"missingData": ["leetcode_url"]}

        username = extract_leetcode_username(leetcode_url)
        if not username:
            return {"missingData": ["leetcode_url"], "error": "Could not extract username from URL"}

        data = fetch_leetcode_stats(username)
        data["username"] = username
        data["leetcode_url"] = leetcode_url

        return data

    @staticmethod
    def _extract_username(url: Optional[str]) -> Optional[str]:
        if not url:
            return None
        url = url.rstrip("/")
        return url.split("/")[-1] if "/" in url else url


def build_context(db: Session, user: User, module_type: str) -> dict:
    builder = ContextBuilder(db)
    context = {"user": {"id": user.id, "name": user.full_name, "role": user.role.value, "email": user.email}}

    student_context = builder.for_student(user)
    if student_context:
        context["student"] = student_context

    coding_context = builder.for_coding(user)
    if coding_context:
        context["coding"] = coding_context

    if module_type == "github_project_analyzer":
        github_context = builder.for_github_projects(user)
        if github_context:
            context["github"] = github_context

    if module_type == "resume_analyzer":
        resume_context = builder.for_resume(user)
        if resume_context:
            context["resume"] = resume_context

    if module_type == "leetcode_analyzer":
        leetcode_context = builder.for_leetcode(user)
        if leetcode_context:
            context["leetcode"] = leetcode_context

    if module_type == "placement_ai":
        github_context = builder.for_github_projects(user)
        if github_context:
            context["github"] = github_context

        leetcode_context = builder.for_leetcode(user)
        if leetcode_context:
            context["leetcode"] = leetcode_context

        resume_context = builder.for_resume(user)
        if resume_context:
            context["resume"] = resume_context

        missing = []
        for ctx in (github_context, leetcode_context, resume_context):
            if ctx and "missingData" in ctx:
                missing.extend(ctx["missingData"])
        context["placement"] = {"missingData": list(set(missing)) if missing else []}

    if user.role.value == "FACULTY":
        faculty_context = builder.for_faculty(user)
        if faculty_context:
            context["faculty"] = faculty_context

    if user.role.value == "PARENT":
        parent_context = builder.for_parent(user)
        if parent_context:
            context["parent"] = parent_context

    if user.role.value == "PLACEMENT_OFFICER":
        placement_context = builder.for_placement_officer(user)
        if placement_context:
            context["placement"] = placement_context

    return context
