from fastapi import APIRouter

from . import plans, webhook

router = APIRouter(prefix="/payments", tags=["payments"])

router.include_router(webhook.router)
router.include_router(plans.router)

__all__ = ["router"]
