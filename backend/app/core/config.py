from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI CampusOS"
    api_prefix: str = "/api"
    database_url: str = "postgresql://postgres:postgres@postgres:5432/ai_campus_os"
    jwt_secret_key: str = "change_this_secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    frontend_url: str = "http://localhost:5173"
    google_client_id: str = "your_google_client_id"
    google_temp_secret: str = "change_this_google_temp_secret"
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"

    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_tls: bool = True

    ai_provider: str = "nvidia"
    ai_base_url: str = "https://integrate.api.nvidia.com/v1"
    ai_model: str = "deepseek-ai/deepseek-v4-pro"
    nvidia_api_key: str = ""

    github_token: str = ""

    voice_enabled: bool = True
    stt_provider: str = "nvidia"
    stt_provider_model: str = ""
    tts_provider: str = "nvidia"
    tts_provider_model: str = ""

    ai_cache_enabled: bool = True
    ai_cache_ttl_minutes: int = 60

    ai_tutor_api_key: str = ""
    ai_tutor_base_url: str = "https://integrate.api.nvidia.com/v1"
    ai_tutor_model: str = "nvidia/llama-3.3-nemotron-super-49b-v1.5"
    ai_tutor_fallback_model: str = "meta/llama-3.3-70b-instruct"
    ai_tutor_timeout: int = 90
    ai_tutor_max_tokens: int = 2048
    ai_tutor_temperature: float = 0.4
    ai_tutor_top_p: float = 0.9

    mock_interview_max_questions: int = 10
    max_ai_requests_per_day: int = 100
    max_ai_tokens: int = 8192

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def allowed_origins(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
