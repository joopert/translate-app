from fastapi import APIRouter

from . import chat, profiles, website_overrides

router = APIRouter(prefix="/simplify", tags=["simplify"])


router.include_router(profiles.router)
router.include_router(website_overrides.router)
router.include_router(chat.router)

__all__ = ["router"]
