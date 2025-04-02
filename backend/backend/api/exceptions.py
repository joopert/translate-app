from typing import Any

from fastapi import HTTPException, status
from pydantic import BaseModel, field_validator

from backend.common.exceptions import ErrorCategory, ErrorLocation, ErrorLocationField
from backend.services.auth.exceptions import BackendException


class Detail(BaseModel):
    loc: list[ErrorLocation | str] | ErrorLocationField
    msg: str
    code: str

    @field_validator("loc")
    def validate_loc(cls, v: Any):
        if not isinstance(v[0], ErrorLocationField | str):
            raise ValueError("First location element must be an ErrorLocation enum")
        return v


def map_auth_exception_to_http(exception: BackendException) -> HTTPException:
    status_mapping = {
        ErrorCategory.VALIDATION: status.HTTP_400_BAD_REQUEST,
        ErrorCategory.AUTHENTICATION: status.HTTP_401_UNAUTHORIZED,
        ErrorCategory.AUTHORIZATION: status.HTTP_403_FORBIDDEN,
        ErrorCategory.NOT_FOUND: status.HTTP_404_NOT_FOUND,
        ErrorCategory.CONFLICT: status.HTTP_409_CONFLICT,
        ErrorCategory.RATE_LIMIT: status.HTTP_429_TOO_MANY_REQUESTS,
        ErrorCategory.SERVER_ERROR: status.HTTP_500_INTERNAL_SERVER_ERROR,
    }

    detail = Detail(
        loc=[exception.location, exception.field],
        code=exception.error_code,
        msg=exception.message,
    )

    return HTTPException(status_code=status_mapping[exception.category], detail=detail.model_dump())
