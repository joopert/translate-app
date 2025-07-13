from fastapi import APIRouter

from backend.api.routers.config.models import SimplifySettings

router = APIRouter()


@router.get(
    "/settings",
    operation_id="auth_get_settings",
    summary="Get settings",
    description="Get settings",
)
async def get_settings() -> SimplifySettings:
    #  Get setting for current user
    return None  # type: ignore


@router.post(
    "/settings",
    operation_id="auth_post_settings",
    summary="Post settings",
    description="Post settings",
)
async def post_settings(data: SimplifySettings) -> SimplifySettings:
    #  Save settings for current user
    return data
