import secrets
from urllib.parse import urlencode

from fastapi import APIRouter, Response

from backend.api.routers.auth.models import OAuthUrl
from backend.core.settings import settings

router = APIRouter()


@router.get("/sign-in/google")
async def google_signin(response: Response) -> OAuthUrl:
    """Redirect users to Cognito's Google sign-in page"""
    state = secrets.token_urlsafe(32)
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
        value=state,
        max_age=300,
        domain=settings.auth.token.cookie.domain,
        httponly=settings.auth.token.cookie.http_only,
        secure=settings.auth.token.cookie.secure,
        samesite=settings.auth.token.cookie.same_site,
    )

    return oauth_url
