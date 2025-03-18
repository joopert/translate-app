import base64

import requests
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer

from backend.api.exceptions import Detail, ErrorLocationField
from backend.api.routers.auth.dependencies import get_current_user
from backend.core.settings import settings

router = APIRouter()


@router.get("/callback")
async def auth_callback(request: Request, code: str, state: str) -> RedirectResponse:
    """Handle the OAuth callback from Cognito"""
    stored_state = request.cookies.get("oauth_state")
    if not stored_state or stored_state != state:
        raise HTTPException(status_code=400, detail="Invalid state parameter")

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

        response = RedirectResponse(url=f"{settings.auth.cognito.frontend_url}/auth/callback")
        response.delete_cookie("oauth_state")
        response.set_cookie(
            key="access_token",
            value=tokens["access_token"],
            max_age=settings.auth.token.access_token.expire_minutes,
            domain=settings.auth.token.cookie.domain,
            httponly=settings.auth.token.cookie.http_only,
            secure=settings.auth.token.cookie.secure,
            samesite=settings.auth.token.cookie.same_site,
        )

        response.set_cookie(
            key="id_token",
            value=tokens["id_token"],
            max_age=settings.auth.token.access_token.expire_minutes,
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
            max_age=settings.auth.token.access_token.expire_minutes,
            httponly=False,
            secure=settings.auth.token.cookie.secure,
            samesite=settings.auth.token.cookie.same_site,
        )

        # The token is not available in request.
        # So we need to pass it as the token argument into get_current_user.
        # Therefore we need to make the HTTPBearer ourselves
        bearer_token = HTTPBearer()
        bearer_token.credentials = tokens["access_token"]  # type: ignore
        current_user = await get_current_user(request=request, token=bearer_token)

        response.set_cookie(
            key="my_profile",
            value=base64.b64encode(current_user.model_dump_json().encode()).decode(),
            domain=settings.auth.token.cookie.domain,
            max_age=settings.auth.token.access_token.expire_minutes,
            httponly=False,
            secure=settings.auth.token.cookie.secure,
            samesite=settings.auth.token.cookie.same_site,
        )

        return response

    except Exception as e:
        print(f"Error in callback: {str(e)}")
        return RedirectResponse(url=f"{settings.auth.cognito.frontend_url}/auth/error?error={str(e)}")
