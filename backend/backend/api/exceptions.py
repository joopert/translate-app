from typing import Any

from fastapi import HTTPException
from pydantic import BaseModel, field_validator

from backend.common.exceptions import ErrorLocation, ErrorLocationField
from backend.services.auth.exceptions import AuthException, ErrorCategory


class Detail(BaseModel):
    loc: list[ErrorLocation | str] | ErrorLocationField
    msg: str
    code: str

    @field_validator("loc")
    def validate_loc(cls, v: Any):
        if not isinstance(v[0], ErrorLocationField | str):
            raise ValueError("First location element must be an ErrorLocation enum")
        return v


def map_auth_exception_to_http(exception: AuthException) -> HTTPException:
    status_mapping = {
        ErrorCategory.VALIDATION: 400,
        ErrorCategory.AUTHENTICATION: 401,
        ErrorCategory.AUTHORIZATION: 403,
        ErrorCategory.NOT_FOUND: 404,
        ErrorCategory.CONFLICT: 409,
        ErrorCategory.RATE_LIMIT: 429,
        ErrorCategory.SERVER_ERROR: 500,
    }

    detail = Detail(
        loc=[exception.location, exception.field],
        code=exception.code,
        msg=exception.message,
    )

    return HTTPException(status_code=status_mapping[exception.category], detail=detail.model_dump())
