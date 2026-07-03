from unittest.mock import MagicMock, patch

import pytest

from app.services.interview_service import (
    INTERVIEW_QUESTIONS_COUNT,
    _default_analysis_value,
    _fallback_questions,
    _get_student_context,
    analyze_answer,
    generate_full_analysis,
    invalidate_context_cache,
    run_mock_interview_ai,
)


class TestFallbackQuestions:
    def test_returns_six_questions(self):
        questions = _fallback_questions("Data Scientist")
        assert len(questions) == INTERVIEW_QUESTIONS_COUNT

    def test_each_question_has_required_keys(self):
        questions = _fallback_questions("Backend Engineer")
        for q in questions:
            assert "id" in q
            assert "type" in q
            assert "question" in q
            assert "expected_keywords" in q
            assert isinstance(q["expected_keywords"], list)
            assert "difficulty" in q
            assert "category" in q

    def test_questions_include_role(self):
        questions = _fallback_questions("DevOps Engineer")
        assert any("DevOps" in q["question"] for q in questions)

    def test_difficulties_are_balanced(self):
        questions = _fallback_questions("Engineer")
        diffs = [q["difficulty"] for q in questions]
        assert diffs == ["easy", "easy", "medium", "medium", "hard", "hard"]

    def test_all_types_are_valid(self):
        questions = _fallback_questions("Engineer")
        valid_types = {"technical", "behavioral"}
        for q in questions:
            assert q["type"] in valid_types, f"Unexpected type: {q['type']}"


class TestDefaultAnalysisValue:
    def test_returns_zero_for_numeric_keys(self):
        numeric_keys = ["communicationScore", "confidenceScore", "clarityScore", "technicalScore", "projectKnowledgeScore"]
        for key in numeric_keys:
            assert _default_analysis_value(key) == 0

    def test_returns_empty_string_for_text_keys(self):
        text_keys = ["grammarFeedback", "idealAnswer", "followUpQuestion", "finalVerdict"]
        for key in text_keys:
            assert _default_analysis_value(key) == ""

    def test_returns_empty_list_for_list_keys(self):
        list_keys = ["strengths", "weaknesses", "exactWeakAreas", "improvementPlan"]
        for key in list_keys:
            assert _default_analysis_value(key) == []

    def test_returns_empty_string_for_unknown_key(self):
        assert _default_analysis_value("nonexistent") == ""


class TestGetStudentContext:
    def test_uses_fallback_when_no_student(self, mock_db, mock_user):
        mock_db.query.return_value.filter.return_value.first.return_value = None
        ctx = _get_student_context(mock_db, mock_user)
        assert ctx["student_name"] == "Test User"
        assert ctx["student_department"] == "Not specified"
        assert ctx["student_year"] == "N/A"
        assert ctx["student_cgpa"] == "N/A"
        assert ctx["student_skills"] == "Not specified"
        assert ctx["preferred_role"] == "Not specified"

    def test_context_is_cached(self, mock_db, mock_user):
        mock_db.query.return_value.filter.return_value.first.return_value = None
        ctx1 = _get_student_context(mock_db, mock_user)
        ctx2 = _get_student_context(mock_db, mock_user)
        assert ctx1 is ctx2

    def test_invalidate_cache(self, mock_db, mock_user):
        mock_db.query.return_value.filter.return_value.first.return_value = None
        ctx1 = _get_student_context(mock_db, mock_user)
        invalidate_context_cache(mock_user.id)
        ctx2 = _get_student_context(mock_db, mock_user)
        assert ctx1 is not ctx2

    def test_extracts_skills_from_student(self, mock_db, mock_user):
        student = MagicMock()
        student.department = "Computer Science"
        student.year = 3
        student.cgpa = 8.5
        student.skills_data = {"Technical": ["Python", "SQL"], "Soft": ["Communication"]}
        student.preferred_role = "SDE"
        mock_db.query.return_value.filter.return_value.first.return_value = student
        ctx = _get_student_context(mock_db, mock_user)
        assert "Python" in ctx["student_skills"]
        assert "SQL" in ctx["student_skills"]
        assert "Communication" in ctx["student_skills"]
        assert ctx["student_department"] == "Computer Science"
        assert ctx["student_cgpa"] == "8.5"

    def test_handles_empty_skills(self, mock_db, mock_user):
        student = MagicMock()
        student.department = None
        student.year = None
        student.cgpa = None
        student.skills_data = {}
        student.preferred_role = None
        mock_db.query.return_value.filter.return_value.first.return_value = student
        ctx = _get_student_context(mock_db, mock_user)
        assert ctx["student_department"] == "Not specified"
        assert ctx["student_skills"] == "Not specified"


class TestAnalyzeAnswer:
    @patch("app.services.interview_service.run_mock_interview_ai")
    def test_returns_analysis_on_success(self, mock_run_ai, sample_question):
        mock_run_ai.return_value = {
            "questionScore": 85,
            "strengths": ["Good explanation"],
            "weaknesses": ["Missing detail"],
            "missedKeywords": ["keyword_x"],
            "feedback": "Good but could be more detailed.",
            "idealAnswer": "A comprehensive answer.",
        }
        result = analyze_answer(sample_question, "Python is a programming language.")
        assert result["questionScore"] == 85
        assert "Good explanation" in result["strengths"]

    @patch("app.services.interview_service.run_mock_interview_ai")
    def test_truncates_long_answer(self, mock_run_ai, sample_question):
        long_answer = "x" * 2000
        mock_run_ai.return_value = {"questionScore": 70, "strengths": [], "weaknesses": [], "missedKeywords": [], "feedback": "", "idealAnswer": ""}
        analyze_answer(sample_question, long_answer)
        passed_prompt = mock_run_ai.call_args[0][0]
        answer_start = passed_prompt.rfind("Answer: ")
        answer_text = passed_prompt[answer_start + len("Answer: "):]
        assert len(answer_text) <= 1500

    @patch("app.services.interview_service.run_mock_interview_ai")
    def test_fallback_on_exception(self, mock_run_ai, sample_question):
        mock_run_ai.side_effect = RuntimeError("API down")
        result = analyze_answer(sample_question, "My answer")
        assert result["questionScore"] == 70
        assert "Attempted to answer" in result["strengths"]
        assert result["feedback"] == "Noted."

    @patch("app.services.interview_service.run_mock_interview_ai")
    def test_includes_question_and_answer_in_prompt(self, mock_run_ai, sample_question):
        mock_run_ai.return_value = {"questionScore": 90, "strengths": [], "weaknesses": [], "missedKeywords": [], "feedback": "", "idealAnswer": ""}
        analyze_answer(sample_question, "My detailed answer")
        prompt = mock_run_ai.call_args[0][0]
        assert "What is Python?" in prompt
        assert "My detailed answer" in prompt
        assert "Technical" in prompt


class TestGenerateFullAnalysis:
    @patch("app.services.interview_service.run_mock_interview_ai")
    def test_returns_analysis_on_success(self, mock_run_ai, mock_db, mock_user, mock_session):
        mock_run_ai.return_value = {
            "communicationScore": 80,
            "confidenceScore": 75,
            "clarityScore": 85,
            "technicalScore": 70,
            "projectKnowledgeScore": 80,
            "grammarFeedback": "Good grammar.",
            "strengths": ["Strong communicator"],
            "weaknesses": ["Needs technical depth"],
            "exactWeakAreas": ["System design"],
            "idealAnswer": "Ideal answer summary",
            "followUpQuestion": "How would you scale this?",
            "improvementPlan": ["Study more", "Practice"],
            "finalVerdict": "Good performance overall.",
        }
        result = generate_full_analysis(mock_db, mock_session, mock_user)
        assert result["communicationScore"] == 80
        assert result["finalVerdict"] == "Good performance overall."

    @patch("app.services.interview_service.run_mock_interview_ai")
    def test_fills_missing_keys_with_defaults(self, mock_run_ai, mock_db, mock_user, mock_session):
        mock_run_ai.return_value = {"communicationScore": 50}
        result = generate_full_analysis(mock_db, mock_session, mock_user)
        assert result["communicationScore"] == 50
        assert result["confidenceScore"] == 0
        assert result["strengths"] == []
        assert result["finalVerdict"] == ""

    @patch("app.services.interview_service.run_mock_interview_ai")
    def test_fallback_on_exception(self, mock_run_ai, mock_db, mock_user, mock_session):
        mock_run_ai.side_effect = RuntimeError("API failure")
        result = generate_full_analysis(mock_db, mock_session, mock_user)
        assert result["communicationScore"] == 70
        assert "Attempted all questions" in result["strengths"]
        assert len(result["improvementPlan"]) == 5

    @patch("app.services.interview_service.run_mock_interview_ai")
    def test_includes_qa_pairs_in_prompt(self, mock_run_ai, mock_db, mock_user, mock_session):
        mock_run_ai.return_value = {"communicationScore": 80, "confidenceScore": 80, "clarityScore": 80, "technicalScore": 80, "projectKnowledgeScore": 80, "grammarFeedback": "", "strengths": [], "weaknesses": [], "exactWeakAreas": [], "idealAnswer": "", "followUpQuestion": "", "improvementPlan": [], "finalVerdict": ""}
        generate_full_analysis(mock_db, mock_session, mock_user)
        prompt = mock_run_ai.call_args[0][0]
        assert "Q1:" in prompt
        assert "Q6:" in prompt
        assert "Answer 1" in prompt
        assert "Software Engineer" in prompt

    @patch("app.services.interview_service.run_mock_interview_ai")
    def test_truncates_answers_in_qa_pairs(self, mock_run_ai, mock_db, mock_user, mock_session):
        long_answer = "x" * 600
        mock_session.answers = [{"text": long_answer}] * 6
        mock_run_ai.return_value = {"communicationScore": 80, "confidenceScore": 80, "clarityScore": 80, "technicalScore": 80, "projectKnowledgeScore": 80, "grammarFeedback": "", "strengths": [], "weaknesses": [], "exactWeakAreas": [], "idealAnswer": "", "followUpQuestion": "", "improvementPlan": [], "finalVerdict": ""}
        generate_full_analysis(mock_db, mock_session, mock_user)
        prompt = mock_run_ai.call_args[0][0]
        qa_section = prompt.split("Q&A:\n")[1] if "Q&A:\n" in prompt else ""
        qa_lines = qa_section.split("\n")
        for line in qa_lines:
            if line.startswith("A:"):
                answer_text = line[len("A: "):]
                assert len(answer_text) <= 500, f"Answer length {len(answer_text)} exceeds 500"
