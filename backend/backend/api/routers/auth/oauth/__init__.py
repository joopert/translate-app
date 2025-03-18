from fastapi import APIRouter

from .callback import router as callback_router
from .google import router as google_router

router = APIRouter()
router.include_router(google_router)
router.include_router(callback_router)
