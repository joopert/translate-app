from fastapi import APIRouter, Depends

from . import password, registration, session
from .dependencies import get_current_user
from .models import CurrentUser
from .oauth import router as oauth_router

router = APIRouter(prefix="/auth", tags=["auth"])


router.include_router(oauth_router)
router.include_router(registration.router)
router.include_router(password.router)
router.include_router(session.router)


@router.get("/protected")
async def protected_route(current_user: CurrentUser = Depends(get_current_user)):
    return {"message": "This is a protected route", "user": current_user}
