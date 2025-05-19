import os
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, model_validator
from pydantic_settings import (
    BaseSettings,
    PydanticBaseSettingsSource,
    SettingsConfigDict,
)

from backend.api.routers.payments.models import PaymentProvider

from .aws.parameter_store import SSMParameterStoreSettingsSource
from .enums import Environment, LogLevels


class AuthTokenCookieSettings(BaseModel):
    http_only: bool = True
    secure: bool = True
    same_site: Literal["lax", "strict", "none"] = "lax"
    domain: str | None = None
    cookies: list[str] = ["access_token", "refresh_token", "is_authenticated", "id_token"]


class AuthCognito(BaseModel):
    user_pool_id: str
    client_id: str
    region: str
    domain: str
    callback_url: str
    frontend_url: str

    @property
    def token_url(self) -> str:
        return f"https://{self.domain}/oauth2/token"

    @property
    def auth_url(self) -> str:
        return f"https://{self.domain}/oauth2/authorize"


class MockData(BaseModel):
    base_dir: Path = Path("./backend/tests/mock_data")

    @property
    def providers_dir(self) -> Path:
        return self.base_dir / "payments" / "providers"

    def get_provider_plans(self, provider: str) -> Path:
        return self.providers_dir / provider / "plans.json"


class RefreshToken(BaseModel):
    expire_minutes: int = 30 * 24 * 3600
    paths: list[str] = [
        "/api/auth/refresh",  # TODO: need to use api_root_path from parent
        "/api/auth/logout/session",  # TODO: need to use api_root_path from parent
        "/api/auth/logout/all-devices",  # TODO: need to use api_root_path from parent
    ]


class AccessToken(BaseModel):
    expire_seconds: int = 3600


class Token(BaseModel):
    cookie: AuthTokenCookieSettings = AuthTokenCookieSettings()
    refresh_token: RefreshToken = RefreshToken()
    access_token: AccessToken = AccessToken()


class Auth(BaseModel):
    token: Token
    cognito: AuthCognito


class Settings(BaseSettings):
    environment: Environment
    db_uri: str
    db_name: str
    loguru_level: LogLevels = LogLevels.INFO
    cors_origins: list[str]
    cors_allow_credentials: bool = True
    cors_allow_methods: list[str] = ["*"]
    cors_allow_headers: list[str] = ["*"]
    db_connection_timeout: int = 5000
    api_root_path: str = "/api"
    widget_root_path: str = "/widget"
    payments: "PaymentProvider"
    mock_data: MockData = MockData()
    use_mock_data: bool = False
    auth: Auth

    model_config = SettingsConfigDict(
        env_file=".env",
        secret_name="application_secrets",  # nosec # type: ignore[typeddict-unknown-key]
        ssm_parameter_name="application_secrets",  # nosec # type: ignore[typeddict-unknown-key]
        region=os.environ.get("REGION"),  # type: ignore[typeddict-unknown-key]
        extra="ignore",
        env_nested_delimiter="__",
    )

    @model_validator(mode="after")
    def validate_payment_configuration(self):
        for origin in self.cors_origins:
            if origin == "*" and self.cors_allow_credentials:
                raise ValueError("Having a origin with '*' is not safe when combined with allow_credentials=True")
        return self

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        ssm_settings = SSMParameterStoreSettingsSource(settings_cls)

        if env_settings.env_vars.get("environment") == Environment.LOCAL:  # type: ignore
            return (
                init_settings,
                env_settings,
                dotenv_settings,
                file_secret_settings,
            )
        return (
            init_settings,
            env_settings,
            dotenv_settings,
            ssm_settings,
            file_secret_settings,
        )


def get_settings() -> Settings:
    """Create and return settings from environment variables."""
    try:
        Settings.model_rebuild()  # since we are using payments: "PaymentProvider" we need to rebuild
        return Settings()  # type: ignore  # some variables are expected to be set through .env
    except Exception as e:
        raise e


settings = get_settings()

if __name__ == "__main__":
    # using loguru gives recursive import error
    print(settings.model_dump())
