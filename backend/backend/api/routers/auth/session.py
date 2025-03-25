import base64
import traceback
import uuid
from typing import cast

import boto3
from asyncer import asyncify
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse

from backend.api.exceptions import Detail, ErrorLocationField
from backend.core.settings import settings
from backend.services.auth.cognito import Cognito
from backend.services.auth.cognito.authentication import authenticate
from backend.utils.log import logger

from .dependencies import get_current_user
from .models import CurrentUser, ResponseFormat, SignIn

router = APIRouter()
cognito_client = boto3.client("cognito-idp", region_name=settings.auth.cognito.region)


@router.get("/me", summary="Get current user information")
async def get_current_user_info(
    current_user: CurrentUser = Depends(get_current_user),
) -> CurrentUser | Detail:
    """
    Get the current authenticated user's information
    """
    return current_user


@router.post(
    "/sign-in",
    summary="Authenticate user using JSON",
    description="Authenticate using username and password in JSON body to get access token",
)
async def signin(signin_data: SignIn) -> Response:
    tokens = await asyncify(authenticate)(signin_data.username, signin_data.password.get_secret_value())

    response = Response()
    response.set_cookie(
        key="access_token",
        value=tokens.access_token.get_secret_value(),
        max_age=settings.auth.token.access_token.expire_seconds,
        domain=settings.auth.token.cookie.domain,
        httponly=settings.auth.token.cookie.http_only,
        secure=settings.auth.token.cookie.secure,
        samesite=settings.auth.token.cookie.same_site,
    )

    for path in settings.auth.token.refresh_token.paths:
        response.set_cookie(
            key="refresh_token",
            value=tokens.refresh_token.get_secret_value(),
            path=path,
            domain=settings.auth.token.cookie.domain,
            max_age=settings.auth.token.refresh_token.expire_minutes,
            httponly=settings.auth.token.cookie.http_only,
            secure=settings.auth.token.cookie.secure,
            samesite=settings.auth.token.cookie.same_site,
        )

    response.set_cookie(
        key="id_token",
        value=tokens.id_token.get_secret_value(),
        domain=settings.auth.token.cookie.domain,
        max_age=settings.auth.token.access_token.expire_seconds,
        httponly=False,
        secure=settings.auth.token.cookie.secure,
        samesite=settings.auth.token.cookie.same_site,
    )

    response.set_cookie(
        key="is_authenticated",
        value="true",
        domain=settings.auth.token.cookie.domain,
        max_age=settings.auth.token.access_token.expire_seconds,
        httponly=False,
        secure=settings.auth.token.cookie.secure,
        samesite=settings.auth.token.cookie.same_site,
    )
    return response


@router.post("/refresh")
async def refresh_token(request: Request) -> Response:
    """Refresh access token using refresh token from cookie"""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=401,
            detail=Detail(
                loc=ErrorLocationField.GENERAL,
                code="NO_REFRESH_TOKEN",
                msg="No refresh token found",
            ).model_dump(),
        )

    try:
        cognito = Cognito(
            user_pool_id=settings.auth.cognito.user_pool_id,
            client_id=settings.auth.cognito.client_id,
            refresh_token=refresh_token,
        )

        cognito.renew_access_token()
        current_user = await get_current_user(request=request, token=cast(str, cognito.access_token))
    except Exception as e:
        unique_error_code = str(uuid.uuid4())
        logger.error(f"code: {unique_error_code}, message: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=401,
            detail=Detail(
                loc=ErrorLocationField.GENERAL,
                code="REFRESH_TOKEN_ERROR",
                msg=f"An error occurred while refreshing your token. Please reference this code: {unique_error_code}",
            ).model_dump(),
        ) from e

    response = Response()
    response.set_cookie(
        key="access_token",
        value=cognito.access_token,  # type: ignore
        domain=settings.auth.token.cookie.domain,
        httponly=settings.auth.token.cookie.http_only,
        max_age=settings.auth.token.access_token.expire_seconds,
        secure=settings.auth.token.cookie.secure,
        samesite=settings.auth.token.cookie.same_site,
    )
    response.set_cookie(
        key="id_token",
        value=cognito.id_token,  # type: ignore
        max_age=settings.auth.token.access_token.expire_seconds,
        domain=settings.auth.token.cookie.domain,
        httponly=settings.auth.token.cookie.http_only,
        secure=settings.auth.token.cookie.secure,
        samesite=settings.auth.token.cookie.same_site,
    )
    response.set_cookie(
        key="is_authenticated",
        value="true",
        domain=settings.auth.token.cookie.domain,
        max_age=settings.auth.token.access_token.expire_seconds,
        httponly=False,
        secure=settings.auth.token.cookie.secure,
        samesite=settings.auth.token.cookie.same_site,
    )

    response.set_cookie(
        key="my_profile",
        value=base64.b64encode(current_user.model_dump_json().encode()).decode(),
        domain=settings.auth.token.cookie.domain,
        max_age=settings.auth.token.access_token.expire_seconds,
        httponly=False,
        secure=settings.auth.token.cookie.secure,
        samesite=settings.auth.token.cookie.same_site,
    )

    return response


@router.post("/logout/session")
async def logout_device(request: Request):
    """Revoke refresh token for current device and clear cookies"""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=401,
            detail=Detail(
                msg="No refresh token provided",
                loc=ErrorLocationField.GENERAL,
                code="LOGOUT_ERROR_NO_REFRESH_TOKEN",
            ),
        )

    try:
        cognito_client.revoke_token(  # type: ignore
            Token=refresh_token, ClientId=settings.auth.cognito.client_id
        )
    except ClientError as e:
        raise HTTPException(
            status_code=400,
            detail=Detail(
                loc=ErrorLocationField.GENERAL,
                code="LOGOUT_ERROR_REVOKE_TOKEN",
                msg=f"Failed to logout from device: {str(e)}",
            ),
        ) from e

    response = JSONResponse(
        content=ResponseFormat(
            code="LOGOUT_SUCCESS",
            msg="Successfully logged out from current device",
        ).model_dump()
    )

    for cookie_name in settings.auth.token.cookie.cookies:
        response.delete_cookie(key=cookie_name)

    return response


@router.post("/logout/all-devices")
async def logout_all_devices(current_user: CurrentUser = Depends(get_current_user)):
    """User-initiated global sign out from all devices"""
    try:
        cognito = Cognito(
            user_pool_id=settings.auth.cognito.user_pool_id,
            client_id=settings.auth.cognito.client_id,
            access_token=current_user.access_token.get_secret_value(),
        )
        cognito.logout()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=Detail(
                loc=ErrorLocationField.GENERAL,
                code="LOGOUT_ERROR_REVOKE_TOKEN",
                msg=f"Failed to logout from all devices: {str(e)}",
            ),
        ) from e

    response = JSONResponse(
        content=ResponseFormat(
            code="LOGOUT_SUCCESS",
            msg="Successfully logged out from all devices",
        ).model_dump()
    )

    for cookie_name in settings.auth.token.cookie.cookies:
        response.delete_cookie(key=cookie_name)

    return response
