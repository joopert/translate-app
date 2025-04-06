import json
import secrets
from urllib.parse import urlencode

from fastapi import APIRouter, Query, Response

from backend.api.routers.auth.models import OAuthUrl
from backend.core.settings import settings

router = APIRouter()


@router.get(
    "/sign-in/google", operation_id="auth_get_sign_in_google", summary="Google sign-in", description="Google sign-in"
)
async def google_signin(
    response: Response,
    redirect: str | None = Query(None, description="URL to redirect to after successful authentication"),
) -> OAuthUrl:
    """Redirect users to Cognito's Google sign-in page"""
    state_token = secrets.token_urlsafe(32)

    state_data = {"token": state_token}
    if redirect:
        state_data["redirect"] = redirect

    state = json.dumps(state_data)
    params = {
        "client_id": settings.auth.cognito.client_id,
        "response_type": "code",
        "scope": "email openid profile aws.cognito.signin.user.admin",
        "redirect_uri": settings.auth.cognito.callback_url,
        "identity_provider": "Google",
        "access_type": "online",  # this way we do not get the refresh token
        "state": state,
    }
    auth_url = f"{settings.auth.cognito.auth_url}?{urlencode(params)}"
    oauth_url = OAuthUrl(url=auth_url)

    response.set_cookie(
        key="oauth_state",
        value=state_token,
        max_age=300,
        domain=settings.auth.token.cookie.domain,
        httponly=settings.auth.token.cookie.http_only,
        secure=settings.auth.token.cookie.secure,
        samesite=settings.auth.token.cookie.same_site,
    )

    return oauth_url
