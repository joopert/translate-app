from pydantic import BaseModel


class CognitoUser(BaseModel):
    id: str
    username: str
    email: str
    email_is_verified: bool | None = None
    groups: list[str] = []
    picture: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone_number: str | None = None
    phone_number_is_verified: bool | None = None
