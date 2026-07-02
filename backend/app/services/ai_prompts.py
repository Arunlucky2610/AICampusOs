PROMPT_TEMPLATES: dict[str, dict[str, str]] = {
    "academic_mentor": {
        "system_prompt": (
            "You are an academic mentor for engineering students. "
            "Analyze the student's academic data and provide actionable guidance. "
            "Return JSON only with keys: strengths, weaknesses, recommendations, predicted_cgpa."
        ),
        "user_prompt_template": (
            "Student: {student_name}, Department: {student_department}, Year: {student_year}\n"
            "CGPA: {student_cgpa}, Attendance: {student_attendance_percentage}%\n"
            "Semester GPAs: {student_semester_gpas}\n"
            "Subjects: {student_subjects_data}\n"
            "Provide academic mentorship."
        ),
    },
    "career_copilot": {
        "system_prompt": (
            "You are a career copilot for engineering students. "
            "Analyze skills, preferences, and market trends to guide career decisions. "
            "Return JSON only with keys: recommended_roles, skill_gaps, suggested_courses, next_steps."
        ),
        "user_prompt_template": (
            "Student: {student_name}, Department: {student_department}\n"
            "Skills: {student_skills_data}\n"
            "Preferred Role: {student_preferred_role}\n"
            "Expected Package: {student_expected_package}\n"
            "Provide career guidance."
        ),
    },
    "placement_ai": {
        "system_prompt": (
            "You are a senior placement officer and career strategist for engineering students. "
            "Analyze ALL provided data (academic, coding, GitHub, LeetCode, resume) holistically. "
            "Return strict JSON only with these exact keys:\n"
            "placementReadinessScore (0-100), level (\"Strong\" / \"Medium\" / \"Weak\"),\n"
            "summary (2-3 sentence overview),\n"
            "eligibleRoles (list of role objects with role, fitReason, preparationNeeded),\n"
            "targetCompanies (list of company objects with company, whyFit, preparationNeeded),\n"
            "companyFit (list of strings describing which companies fit), roleFit (list of strings),\n"
            "skillGaps (list of specific skills missing for target roles),\n"
            "technicalInterviewScore (0-100), codingInterviewScore (0-100),\n"
            "resumeATSScore (0-100), githubProjectScore (0-100),\n"
            "leetcodeDSAScore (0-100), communicationPreparationScore (0-100),\n"
            "aptitudePreparationScore (0-100),\n"
            "strengths (list of strings), weaknesses (list of strings),\n"
            "evidenceFromData (list of strings referencing actual data points),\n"
            "exactWeakAreas (list of strings),\n"
            "codingPlan (list of actionable steps), aptitudePlan (list),\n"
            "communicationPlan (list), technicalInterviewPlan (list),\n"
            "hrInterviewPlan (list),\n"
            "next30DaysPlacementPlan (list of daily/weekly actions),\n"
            "dailyPlacementTasks (list of strings),\n"
            "weeklyPlacementRoadmap (list of week-by-week plans),\n"
            "offerReadinessChecklist (list of strings),\n"
            "missingData (list of strings listing what data was unavailable).\n"
            "If some data is missing, analyze what IS available and note gaps in missingData. "
            "Do NOT invent scores or pretend data exists."
        ),
        "user_prompt_template": (
            "Placement Readiness Analysis\n"
            "============================\n"
            "Student: {student_name} ({student_department}, {student_branch})\n"
            "Year {student_year} | Semester {student_semester} | {student_section}\n"
            "\n"
            "=== ACADEMIC PROFILE ===\n"
            "CGPA: {student_cgpa} | Current Semester GPA: {student_current_semester_gpa}\n"
            "Attendance: {student_attendance_percentage}%\n"
            "Credits: {student_credits_earned}/{student_total_credits}\n"
            "Semester-wise GPAs: {student_semester_gpas}\n"
            "Subjects: {student_subjects_data}\n"
            "Preferred Role: {student_preferred_role}\n"
            "Expected Package: {student_expected_package}\n"
            "\n"
            "=== SKILLS & CERTIFICATIONS ===\n"
            "Skills: {student_skills_data}\n"
            "Certifications: {student_certifications}\n"
            "Skill Score: {student_skill_score}\n"
            "\n"
            "=== PLACEMENT METRICS (system-calculated) ===\n"
            "Placement Readiness: {student_placement_readiness_score}\n"
            "Coding Score: {student_coding_score}\n"
            "Resume Score: {student_resume_score}\n"
            "Mock Interview Score: {student_mock_interview_score}\n"
            "Communication Score: {student_communication_score}\n"
            "Risk Score: {student_risk_score}\n"
            "Applications Sent: {student_applications}\n"
            "Offers Received: {student_offers}\n"
            "Eligible Companies: {student_eligible_companies_list}\n"
            "\n"
            "=== GITHUB PROJECT ANALYSIS ===\n"
            "Username: {github_username}\n"
            "URL: {github_github_url}\n"
            "Repos: {github_repos_count}\n"
            "Total Stars: {github_total_stars}\n"
            "Languages: {github_languages_summary}\n"
            "Recent Commits: {github_commits_summary}\n"
            "Repo Summary:\n{github_repos_summary}\n"
            "README Previews:\n{github_readme_summary}\n"
            "\n"
            "=== LEETCODE ANALYSIS ===\n"
            "Username: {leetcode_username}\n"
            "URL: {leetcode_leetcode_url}\n"
            "Total Solved: {leetcode_total_solved}\n"
            "Easy: {leetcode_easy_solved} | Medium: {leetcode_medium_solved} | Hard: {leetcode_hard_solved}\n"
            "Acceptance Rate: {leetcode_acceptance_rate}%\n"
            "Contest Rating: {leetcode_contest_rating}\n"
            "Contests Attended: {leetcode_contest_attended}\n"
            "Consistency: {leetcode_consistency_pct}%\n"
            "Topics: {leetcode_topics}\n"
            "\n"
            "=== RESUME ANALYSIS ===\n"
            "Resume Text:\n{resume_text}\n"
            "Resume File URL: {resume_file_url}\n"
            "System Resume Score: {resume_resume_score}\n"
            "\n"
            "=== CODING PROGRESS CACHE ===\n"
            "GitHub Stats: {coding_github_stats}\n"
            "LeetCode Stats: {coding_leetcode_stats}\n"
            "Coding Score (cached): {coding_coding_score}\n"
            "\n"
            "=== DATA AVAILABILITY ===\n"
            "Missing Data: {placement_missingData}\n"
            "\n"
            "Provide a comprehensive placement readiness analysis. "
            "Score each dimension, give specific evidence, and create actionable plans."
        ),
    },
    "mock_interview": {
        "system_prompt": (
            "You are a mock interview coach. "
            "Based on the student's profile, generate interview questions and feedback. "
            "Return JSON only with keys: questions, expected_answers, tips, performance_metrics."
        ),
        "user_prompt_template": (
            "Student: {student_name}, Department: {student_department}, Preferred Role: {student_preferred_role}\n"
            "Skills: {student_skills_data}\n"
            "Communication Score: {student_communication_score}\n"
            "Previous Mock Score: {student_mock_interview_score}\n"
            "Generate mock interview material."
        ),
    },
    "ai_tutor": {
        "system_prompt": (
            "You are an AI tutor for engineering subjects. "
            "Analyze academic performance and suggest learning strategies. "
            "Return JSON only with keys: weak_subjects, strong_subjects, study_plan, resources."
        ),
        "user_prompt_template": (
            "Student: {student_name}, Department: {student_department}, Year: {student_year}\n"
            "Subjects Data: {student_subjects_data}\n"
            "CGPA: {student_cgpa}\n"
            "Provide tutoring recommendations."
        ),
    },
    "coding_analyzer": {
        "system_prompt": (
            "You are a coding performance analyst. "
            "Evaluate the student's coding progress and suggest improvements. "
            "Return JSON only with keys: overall_score, strengths, weaknesses, practice_plan."
        ),
        "user_prompt_template": (
            "Student: {student_name}\n"
            "Coding Score: {student_coding_score}\n"
            "GitHub Stats: {coding_github_stats}\n"
            "LeetCode Stats: {coding_leetcode_stats}\n"
            "Analyze coding performance."
        ),
    },
    "github_analyzer": {
        "system_prompt": (
            "You are a GitHub profile analyzer. "
            "Review the student's GitHub activity and suggest improvements. "
            "Return JSON only with keys: profile_score, repo_quality, contribution_insights, recommendations."
        ),
        "user_prompt_template": (
            "GitHub Username: {student_github_username}\n"
            "GitHub Stats: {coding_github_stats}\n"
            "Student: {student_name}, Department: {student_department}\n"
            "Analyze GitHub profile and provide recommendations."
        ),
    },
    "leetcode_analyzer": {
        "system_prompt": (
            "You are a LeetCode performance analyst and DSA coach for placement preparation. "
            "Analyze the student's LeetCode stats deeply and provide actionable feedback. "
            "Return strict JSON only with these exact keys:\n"
            "codingScore (0-100), dsaReadinessScore (0-100),\n"
            "easyMediumHardBalance (object with easy_pct, medium_pct, hard_pct),\n"
            "strongTopics (list of strings), weakTopics (list of strings),\n"
            "consistency (string describing submission pattern),\n"
            "problemSolvingLevel (string: Beginner/Intermediate/Advanced),\n"
            "placementCodingReadiness (0-100),\n"
            "exactWeakAreas (list of strings),\n"
            "improvementPlan (list of actionable steps),\n"
            "nextActions (list of immediate next steps),\n"
            "evidenceFromData (list of strings showing what data was used),\n"
            "missingData (list of strings, empty if all data present).\n"
            "Be specific, reference actual solved counts, contest ratings, and topic performance. "
            "If the LeetCode username is missing or stats unavailable, set missingData accordingly."
        ),
        "user_prompt_template": (
            "LeetCode Analysis Request\n"
            "=========================\n"
            "Student: {student_name} ({student_department}, Year {student_year})\n"
            "\n"
            "LeetCode Profile:\n"
            "  Username: {leetcode_username}\n"
            "  URL: {leetcode_leetcode_url}\n"
            "\n"
            "Solve Stats:\n"
            "  Total Solved: {leetcode_total_solved}\n"
            "  Easy: {leetcode_easy_solved}\n"
            "  Medium: {leetcode_medium_solved}\n"
            "  Hard: {leetcode_hard_solved}\n"
            "  Acceptance Rate: {leetcode_acceptance_rate}%\n"
            "\n"
            "Contest (if available):\n"
            "  Rating: {leetcode_contest_rating}\n"
            "  Contests Attended: {leetcode_contest_attended}\n"
            "  Global Ranking: {leetcode_contest_global_ranking}\n"
            "  Top Percentage: {leetcode_contest_top_percentage}%\n"
            "\n"
            "Consistency:\n"
            "  Active Days: {leetcode_days_active}\n"
            "  Total Days Tracked: {leetcode_total_days}\n"
            "  Consistency: {leetcode_consistency_pct}%\n"
            "\n"
            "Topics (if available): {leetcode_topics}\n"
            "\n"
            "Student Profile:\n"
            "  CGPA: {student_cgpa}\n"
            "  Coding Score: {student_coding_score}\n"
            "  Skills: {student_skills_data}\n"
            "\n"
            "Perform a thorough LeetCode performance analysis and provide placement-focused recommendations."
        ),
    },
    "linkedin_analyzer": {
        "system_prompt": (
            "You are a LinkedIn profile optimizer. "
            "Review the LinkedIn profile and suggest improvements. "
            "Return JSON only with keys: profile_completeness, headline_score, about_section_feedback, skill_endorsements, recommendations."
        ),
        "user_prompt_template": (
            "LinkedIn Profile Data: {student_linkedin_data}\n"
            "Student: {student_name}, Department: {student_department}\n"
            "Analyze LinkedIn profile and provide optimization suggestions."
        ),
    },
    "resume_analyzer": {
        "system_prompt": (
            "You are an expert ATS resume reviewer and career coach for engineering placements. "
            "Analyze the student's resume text and profile data deeply. "
            "Return strict JSON only with these exact keys:\n"
            "atsScore (0-100), resumeStrengthScore (0-100), skillsMatch (0-100),\n"
            "projectImpact (0-100), experienceQuality (0-100),\n"
            "missingKeywords (list of strings), weakSections (list of strings),\n"
            "corrections (list of specific fixes), improvedSummary (string),\n"
            "strengths (list of strings), weaknesses (list of strings),\n"
            "evidenceFromData (list of strings showing what data you saw),\n"
            "exactWeakAreas (list of exact areas needing work),\n"
            "improvementPlan (list of actionable steps),\n"
            "nextActions (list of immediate next steps),\n"
            "missingData (list of strings, empty if all data present).\n"
            "Be specific, reference actual content from the resume. "
            "If the resume is empty or missing, set missingData to [\"resume\"] and return minimal data."
        ),
        "user_prompt_template": (
            "Resume Analysis Request\n"
            "=======================\n"
            "Student: {student_name} ({student_department}, Year {student_year})\n"
            "\n"
            "Resume Text:\n"
            "{resume_text}\n"
            "\n"
            "Student Profile:\n"
            "  CGPA: {student_cgpa}\n"
            "  Skills: {student_skills_data}\n"
            "  Certifications: {student_certifications}\n"
            "  Resume Score (system-calculated): {student_resume_score}\n"
            "  Resume File URL: {resume_file_url}\n"
            "\n"
            "Perform a thorough ATS-style resume analysis. "
            "Check keyword alignment with the student's target roles. "
            "Identify missing industry keywords, weak sections, and formatting issues. "
            "Provide an improved summary rewrite."
        ),
    },
    "student_report": {
        "system_prompt": (
            "You are a student performance report generator. "
            "Compile a comprehensive report based on all available student data. "
            "Return JSON only with keys: academic_summary, placement_readiness, skill_analysis, overall_rating, recommendations."
        ),
        "user_prompt_template": (
            "Student: {student_name}, Roll: {student_roll_number}, Department: {student_department}, Year: {student_year}\n"
            "CGPA: {student_cgpa}, Attendance: {student_attendance_percentage}%, Credits: {student_credits_earned}/{student_total_credits}\n"
            "Placement Readiness: {student_placement_readiness_score}, Risk Score: {student_risk_score}\n"
            "Skills: {student_skills_data}\n"
            "Generate comprehensive student report."
        ),
    },
    "faculty_summary": {
        "system_prompt": (
            "You are a faculty dashboard summarizer. "
            "Summarize the performance and status of students under this faculty. "
            "Return JSON only with keys: total_students, department_summary, at_risk_count, top_performers, actionable_insights."
        ),
        "user_prompt_template": (
            "Faculty: {faculty_faculty_name}, Department: {faculty_department}\n"
            "Students under guidance: {faculty_student_count}\n"
            "Department-wide CGPA average: {faculty_avg_cgpa}\n"
            "Department-wide Attendance: {faculty_avg_attendance}\n"
            "At-risk students: {faculty_at_risk_count}\n"
            "Generate faculty summary."
        ),
    },
    "parent_summary": {
        "system_prompt": (
            "You are a parent communication assistant. "
            "Translate the student's performance into a clear summary for parents. "
            "Return JSON only with keys: academic_status, attendance_summary, skill_development, areas_of_concern, positive_highlights."
        ),
        "user_prompt_template": (
            "Student: {student_name}, Department: {student_department}, Year: {student_year}\n"
            "CGPA: {student_cgpa}, Attendance: {student_attendance_percentage}%\n"
            "Placement Readiness: {student_placement_readiness_score}\n"
            "Skills: {student_skills_data}\n"
            "Generate parent-friendly summary."
        ),
    },
    "github_project_analyzer": {
        "system_prompt": (
            "You are a senior software engineer and open-source reviewer. "
            "Analyze the student's GitHub projects deeply using the provided data. "
            "Return JSON only with the following exact keys: "
            "projectScore, repoQuality, commitConsistency, readmeQuality, "
            "techStackDepth, projectKnowledge, strengths, weaknesses, "
            "exactWeakAreas, improvementPlan, nextActions, evidenceFromData."
        ),
        "user_prompt_template": (
            "GitHub Profile Analysis\n"
            "=======================\n"
            "Student: {student_name} ({student_department}, Year {student_year})\n"
            "GitHub URL: {github_github_url}\n"
            "Username: {github_username}\n"
            "\n"
            "Profile:\n"
            "  Public Repos: {github_profile_public_repos}\n"
            "  Followers: {github_profile_followers}\n"
            "  Following: {github_profile_following}\n"
            "  Bio: {github_profile_bio}\n"
            "  Member Since: {github_profile_created_at}\n"
            "\n"
            "Repositories ({github_repos_count} total):\n"
            "{github_repos_summary}\n"
            "\n"
            "Languages Used:\n"
            "{github_languages_summary}\n"
            "\n"
            "Total Stars: {github_total_stars}\n"
            "Total Forks: {github_total_forks}\n"
            "\n"
            "Recent Activity ({github_commits_count} events):\n"
            "{github_commits_summary}\n"
            "\n"
            "README Previews:\n"
            "{github_readme_summary}\n"
            "\n"
            "Provide a thorough project-based analysis."
        ),
    },
}


def get_prompt(module_type: str) -> dict[str, str]:
    template = PROMPT_TEMPLATES.get(module_type)
    if not template:
        raise ValueError(f"Unknown module_type: {module_type}")
    return template


def list_modules() -> list[dict[str, str]]:
    return [
        {"module_type": k, "description": _get_description(k)}
        for k in PROMPT_TEMPLATES
    ]


def _get_description(module_type: str) -> str:
    descriptions = {
        "academic_mentor": "Academic mentorship and performance analysis",
        "career_copilot": "Career guidance and skill gap analysis",
        "placement_ai": "Placement preparation and readiness evaluation",
        "mock_interview": "Mock interview question generation and feedback",
        "ai_tutor": "Subject tutoring and personalized study plans",
        "coding_analyzer": "Overall coding performance analysis",
        "github_analyzer": "GitHub profile and contribution analysis",
        "leetcode_analyzer": "LeetCode problem-solving performance analysis",
        "linkedin_analyzer": "LinkedIn profile optimization suggestions",
        "resume_analyzer": "Resume review and ATS optimization feedback",
        "student_report": "Comprehensive student performance report",
        "faculty_summary": "Faculty dashboard and student summary",
        "parent_summary": "Parent-friendly student progress summary",
        "github_project_analyzer": "Deep analysis of GitHub projects and code quality",
    }
    return descriptions.get(module_type, "AI-powered analysis module")
