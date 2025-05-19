from fastapi import APIRouter

from . import chat

router = APIRouter(prefix="/chat", tags=["chat"])

router.include_router(chat.router)

__all__ = ["router"]
