from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="HOUSE_PRICE_", extra="ignore")

    app_name: str = "House Price Prediction API"
    environment: str = "production"
    model_name: str = "model_xgb"
    artifacts_dir: str | None = None
    allowed_origins: list[str] = Field(default_factory=list)


@lru_cache
def get_settings() -> Settings:
    return Settings()
