from sqlalchemy.orm import Session

from app.models.prediction import Prediction
from app.models.student import Student
from app.services.ai_service import placement_prediction, risk_prediction


def create_student_predictions(db: Session, student: Student) -> list[Prediction]:
    outputs = [
        ("PLACEMENT", placement_prediction(student)),
        ("RISK", risk_prediction(student)),
    ]
    predictions = [
        Prediction(
            student_id=student.id,
            prediction_type=kind,
            score=data["score"],
            result=data["result"],
            explanation=data["explanation"],
        )
        for kind, data in outputs
    ]
    db.add_all(predictions)
    db.commit()
    return predictions
