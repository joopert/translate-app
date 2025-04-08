import uuid
from typing import Any, cast

import boto3
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer
from pycognito.exceptions import (  # type: ignore[missing-stub]
    TokenVerificationException,
)
from pydantic import SecretStr

from backend.api.exceptions import Detail, ErrorLocationField
from backend.core.settings import settings
from backend.services.auth.cognito import Cognito
from backend.utils.constants import INTERNAL_SERVER_ERROR_TEXT
from backend.utils.log import logger

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
    try:
        cognito = Cognito(
            user_pool_id=settings.auth.cognito.user_pool_id,
            client_id=settings.auth.cognito.client_id,
            user_pool_region=settings.auth.cognito.region,
            access_token=access_token,
            id_token=id_token,
        )

        access_token_content = cognito.verify_token(  # type: ignore
            access_token, "access_token", "access"
        )
        if id_token:
            id_token_content = cognito.verify_token(id_token, "id_token", "id")  # type: ignore
            return CurrentUser(
                id=access_token_content["sub"],
                access_token=SecretStr(access_token),
                username=id_token_content["cognito:username"],
                email=id_token_content["email"],
                email_is_verified=id_token_content["email_verified"],
                groups=id_token_content.get("cognito:groups", []),
                picture=id_token_content.get("picture"),
                first_name=id_token_content.get("given_name"),
                last_name=id_token_content.get("family_name"),
                phone_number=id_token_content.get("phone_number"),
                phone_number_is_verified=id_token_content.get("phone_number_verified"),
            )

        else:
            user_info: Any = cognito.get_user()  # pyright: ignore[reportUnknownMemberType]
            return CurrentUser(
                id=access_token_content["sub"],
                access_token=SecretStr(access_token),
                username=user_info._metadata.get("username"),
                email=user_info._data["email"],
                email_is_verified=user_info.email_verified,
                groups=user_info._data.get("cognito:groups", []),
                picture=user_info._data.get("picture"),
                first_name=user_info._data.get("given_name"),
                last_name=user_info._data.get("family_name"),
                phone_number=user_info._data.get("phone_number"),
                phone_number_is_verified=user_info.phone_number_verified,
            )

    except TokenVerificationException as e:
        if "Signature has expired" in str(e):
            raise HTTPException(
                status_code=401,
                detail=Detail(
                    loc=ErrorLocationField.GENERAL,
                    code="TOKEN_EXPIRED",
                    msg="Token expired",
                ).model_dump(),
            ) from e
        raise HTTPException(
            status_code=401,
            detail=Detail(
                loc=ErrorLocationField.GENERAL,
                code="INVALID_TOKEN",
                msg="Invalid token",
            ).model_dump(),
        ) from e
    except cognito_client.exceptions.NotAuthorizedException as e:
        raise HTTPException(
            status_code=401,
            detail=Detail(
                loc=ErrorLocationField.GENERAL,
                code="INVALID_TOKEN",
                msg="Invalid token",
            ).model_dump(),
        ) from e
    except Exception as e:
        unique_error_code = str(uuid.uuid4())
        logger.error(f"code: {unique_error_code}, message: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=Detail(
                loc=ErrorLocationField.GENERAL,
                code="INTERNAL_SERVER_ERROR",
                msg=INTERNAL_SERVER_ERROR_TEXT.format(unique_error_code=unique_error_code),
            ).model_dump(),
        ) from e
