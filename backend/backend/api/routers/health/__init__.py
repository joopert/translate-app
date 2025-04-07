from fastapi import APIRouter

from . import health

router = APIRouter(prefix="/health", tags=["health"])

router.include_router(health.router)

__all__ = ["router"]
