from fastapi import APIRouter

from backend.api.routers.users.handlers import router as handlers_router

router = APIRouter(prefix="/users", tags=["users"])

router.include_router(handlers_router)
