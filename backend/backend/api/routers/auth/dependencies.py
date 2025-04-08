from typing import cast

import boto3
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer

from backend.api.exceptions import Detail, ErrorLocationField
from backend.core.settings import settings
from backend.services.auth.cognito.user_management import get_current_user as get_current_cognito_user

from .models import CurrentUser

cognito_client = boto3.client("cognito-idp", region_name=settings.auth.cognito.region)


async def get_current_user(
    request: Request,
    token: HTTPBearer | str | None = Depends(HTTPBearer(auto_error=False)),
    id_token: str | None = None,
) -> CurrentUser:
    access_token: str | None = None
    if isinstance(token, str):
        access_token = token
    else:
        access_token = cast(
            str | None,
            token.credentials if token else request.cookies.get("access_token"),  # type: ignore[attr-defined]
        )

    if not access_token:
        raise HTTPException(
            status_code=401,
            detail=Detail(
                loc=ErrorLocationField.GENERAL,
                code="NO_TOKEN",
                msg="No authentication token found in request",
            ).model_dump(),
        )

    if id_token is None:
        id_token = request.cookies.get("id_token")

    return get_current_cognito_user(access_token, id_token)
