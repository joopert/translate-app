import base64
import json
import traceback
import uuid

import requests
from asyncer import asyncify
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

from backend.api.exceptions import Detail, ErrorLocationField
from backend.core.settings import settings
from backend.services.auth.cognito.user_management import get_current_user
from backend.services.users.user_management import get_user_by_email, handle_user_registration
from backend.utils.constants import INTERNAL_SERVER_ERROR_TEXT
from backend.utils.log import logger

router = APIRouter()


@router.get(
    "/callback",
    operation_id="auth_callback_auth_callback_get",
    summary="Auth Callback",
    description="Handle the OAuth callback from Cognito",
)
async def auth_callback(request: Request, code: str, state: str) -> RedirectResponse:
    """Handle the OAuth callback from Cognito"""
    stored_state_token = request.cookies.get("oauth_state")
    redirect_path = None

    try:
        state_data = json.loads(state)
        state_token = state_data.get("token")
        redirect_path = state_data.get("redirect")

        if not stored_state_token or not state_token or stored_state_token != state_token:
            raise HTTPException(status_code=400, detail="Invalid state parameter")
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail="Invalid state format") from e

    try:
        token_response = requests.post(
            settings.auth.cognito.token_url,
            data={
                "grant_type": "authorization_code",
                "client_id": settings.auth.cognito.client_id,
                "code": code,
                "redirect_uri": settings.auth.cognito.callback_url,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=5,
        )

        if not token_response.ok:
            raise HTTPException(
                status_code=400,
                detail=Detail(
                    loc=ErrorLocationField.GENERAL,
                    code="EXCHANGE_CODE_FAILED",
                    msg=f"Failed to exchange code: {token_response.text}",
                ).model_dump(),
            )

        tokens = token_response.json()
        if redirect_path and isinstance(redirect_path, str) and redirect_path.startswith("/"):
            callback_url = f"{settings.auth.cognito.frontend_url}/auth/callback?redirect={redirect_path}"
        else:
            callback_url = f"{settings.auth.cognito.frontend_url}/auth/callback"

        response = RedirectResponse(url=callback_url)
        response.delete_cookie("oauth_state")
        response.set_cookie(
            key="access_token",
            value=tokens["access_token"],
            max_age=settings.auth.token.access_token.expire_seconds,
            domain=settings.auth.token.cookie.domain,
            httponly=settings.auth.token.cookie.http_only,
            secure=settings.auth.token.cookie.secure,
            samesite=settings.auth.token.cookie.same_site,
        )

        response.set_cookie(
            key="id_token",
            value=tokens["id_token"],
            max_age=settings.auth.token.access_token.expire_seconds,
            domain=settings.auth.token.cookie.domain,
            httponly=settings.auth.token.cookie.http_only,
            secure=settings.auth.token.cookie.secure,
            samesite=settings.auth.token.cookie.same_site,
        )

        for path in settings.auth.token.refresh_token.paths:
            response.set_cookie(
                key="refresh_token",
                value=tokens["refresh_token"],
                path=path,
                domain=settings.auth.token.cookie.domain,
                max_age=settings.auth.token.refresh_token.expire_minutes,
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

        current_user = await asyncify(get_current_user)(
            access_token=tokens["access_token"], id_token=tokens["id_token"]
        )

        user_email = current_user.email
        existing_user = await get_user_by_email(user_email)
        if existing_user is None:
            logger.info(f"New Google OAuth user detected: {user_email}. Creating user record.")
            await handle_user_registration(user_email, auth_user_id=current_user.id)

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
    except Exception as e:
        unique_error_code = str(uuid.uuid4())
        logger.error(f"code: {unique_error_code}, message: {str(e)}")
        traceback.print_exc()
        return RedirectResponse(
            url=f"{settings.auth.cognito.frontend_url}/auth/callback?error=internal_server_error&error_description={INTERNAL_SERVER_ERROR_TEXT.format(unique_error_code=unique_error_code)}"
        )
