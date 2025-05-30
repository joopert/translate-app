import base64

from asyncer import asyncify
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse

from backend.api.exceptions import Detail, ErrorLocationField
from backend.core.settings import settings
from backend.services.auth.cognito import Cognito
from backend.services.auth.cognito.authentication import authenticate
from backend.services.auth.cognito.authentication import refresh_token as cognito_refresh_token
from backend.services.auth.cognito.user_management import cognito_logout

from .dependencies import get_current_user
from .models import CurrentUser, ResponseFormat, SignIn

router = APIRouter()


@router.get(
    "/me",
    operation_id="auth_get_me",
    summary="Get current user information",
    description="Get the current authenticated user's information",
)
async def get_current_user_info(
    current_user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """
    Get the current authenticated user's information
    """
    return current_user


@router.post(
    "/sign-in",
    operation_id="auth_post_sign_in",
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


@router.post(
    "/refresh",
    operation_id="auth_post_refresh",
    summary="Refresh access token using refresh token from cookie",
    description="Refresh access token using refresh token from cookie",
)
async def refresh_token(request: Request) -> Response:
    """Refresh access token using refresh token from cookie"""
    refresh_token = request.cookies.get("refresh_token")
    tokens = await asyncify(cognito_refresh_token)(refresh_token)

    current_user = await get_current_user(
        request=request,
        token=tokens.access_token.get_secret_value(),
        id_token=tokens.id_token.get_secret_value(),
    )
    response = Response()
    response.set_cookie(
        key="access_token",
        value=tokens.access_token.get_secret_value(),
        domain=settings.auth.token.cookie.domain,
        httponly=settings.auth.token.cookie.http_only,
        max_age=settings.auth.token.access_token.expire_seconds,
        secure=settings.auth.token.cookie.secure,
        samesite=settings.auth.token.cookie.same_site,
    )
    response.set_cookie(
        key="id_token",
        value=tokens.id_token.get_secret_value(),
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


@router.post(
    "/logout/session",
    operation_id="auth_post_logout_session",
    summary="Logout from current device",
    description="Revoke refresh token for current device and clear cookies",
)
async def logout_device(request: Request):
    """Revoke refresh token for current device and clear cookies."""
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

    await asyncify(cognito_logout)(refresh_token)

    response = JSONResponse(
        content=ResponseFormat(
            code="LOGOUT_SUCCESS",
            msg="Successfully logged out from current device",
        ).model_dump()
    )

    for cookie_name in settings.auth.token.cookie.cookies:
        response.delete_cookie(key=cookie_name)

    return response


@router.post(
    "/logout/all-devices",
    operation_id="auth_post_logout_all_devices",
    summary="Logout from all devices",
    description="Revoke refresh token for all devices and clear cookies",
)
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
