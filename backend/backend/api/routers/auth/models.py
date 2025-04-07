from typing import TypeVar

from pydantic import BaseModel, Field, SecretStr

from backend.services.auth.cognito.models import CognitoUser

T = TypeVar("T", bound=BaseModel)


class SignUp(BaseModel):
    email: str
    password: SecretStr


class SignIn(BaseModel):
    username: str  # we keep it like this, because now we stay flexible if we keep email or username separate
    password: SecretStr


class ConfirmSignUp(BaseModel):
    email: str
    confirmation_code: str


class ForgotPassword(BaseModel):
    email: str


class ResendConfirmationCode(BaseModel):
    email: str


class ConfirmForgotPassword(BaseModel):
    email: str
    confirmation_code: str
    new_password: SecretStr


class ChangePassword(BaseModel):
    old_password: SecretStr
    new_password: SecretStr


class ResponseFormat(BaseModel):
    code: str
    msg: str


class OAuthUrl(BaseModel):
    url: str


class CurrentUser(CognitoUser):
    access_token: SecretStr = Field(exclude=True)
