import pytest
from unittest.mock import MagicMock, patch

from app.models.user import User
from app.models.interview import InterviewSession


@pytest.fixture
def mock_user():
    user = MagicMock(spec=User)
    user.id = 1
    user.full_name = "Test User"
    user.email = "test@example.com"
    return user


@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def sample_question():
    return {
        "id": 1,
        "type": "technical",
        "question": "What is Python?",
        "expected_keywords": ["programming", "language"],
        "difficulty": "easy",
        "category": "Technical",
    }


@pytest.fixture
def sample_questions():
    return [
        {"id": 1, "type": "technical", "question": "Q1", "expected_keywords": ["k1"], "difficulty": "easy", "category": "Technical"},
        {"id": 2, "type": "behavioral", "question": "Q2", "expected_keywords": ["k2"], "difficulty": "medium", "category": "Behavioral"},
        {"id": 3, "type": "technical", "question": "Q3", "expected_keywords": ["k3"], "difficulty": "easy", "category": "Project"},
        {"id": 4, "type": "system_design", "question": "Q4", "expected_keywords": ["k4"], "difficulty": "medium", "category": "System Design"},
        {"id": 5, "type": "behavioral", "question": "Q5", "expected_keywords": ["k5"], "difficulty": "hard", "category": "Behavioral"},
        {"id": 6, "type": "technical", "question": "Q6", "expected_keywords": ["k6"], "difficulty": "hard", "category": "Domain"},
    ]


@pytest.fixture(autouse=True)
def clear_context_cache():
    from app.services.interview_service import _context_cache
    _context_cache.clear()


@pytest.fixture
def mock_session(mock_user, sample_questions):
    session = MagicMock(spec=InterviewSession)
    session.id = 1
    session.user_id = mock_user.id
    session.role_applied_for = "Software Engineer"
    session.status = "completed"
    session.questions = sample_questions
    session.answers = [
        {"question_number": 1, "text": "Answer 1", "analysis": {"questionScore": 80}},
        {"question_number": 2, "text": "Answer 2", "analysis": {"questionScore": 70}},
        {"question_number": 3, "text": "Answer 3", "analysis": {"questionScore": 90}},
        {"question_number": 4, "text": "Answer 4", "analysis": {"questionScore": 60}},
        {"question_number": 5, "text": "Answer 5", "analysis": {"questionScore": 75}},
        {"question_number": 6, "text": "Answer 6", "analysis": {"questionScore": 85}},
    ]
    return session
