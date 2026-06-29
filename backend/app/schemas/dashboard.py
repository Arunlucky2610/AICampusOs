from typing import Any

from pydantic import BaseModel


class DashboardResponse(BaseModel):
    role: str
    kpis: list[dict[str, Any]]
    charts: dict[str, Any]
    tables: dict[str, Any]
    notifications: list[dict[str, Any]]
    predictions: list[dict[str, Any]]
    recommendations: list[str]
