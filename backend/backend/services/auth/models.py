from pydantic import BaseModel, SecretStr


class Tokens(BaseModel):
    access_token: SecretStr
    refresh_token: SecretStr
    id_token: SecretStr
