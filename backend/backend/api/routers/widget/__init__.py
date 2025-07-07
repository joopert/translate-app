from fastapi import APIRouter

from .config import router as config_router

router = APIRouter(prefix="/widget", tags=["widget"])

# router.include_router(chat.router)
router.include_router(config_router)

__all__ = ["router"]
