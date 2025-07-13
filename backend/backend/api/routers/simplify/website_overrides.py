from datetime import datetime

from beanie.odm.fields import PydanticObjectId
from fastapi import APIRouter, Depends, status
from fastapi.exceptions import HTTPException

# from backend.api.routers.auth.dependencies import get_current_user
from backend.services.users.models import User
from backend.utils.log import logger

from .models import Profile, WebsiteOverride, WebsiteOverrideCreate


async def get_current_user():  # TODO: remove this!
    return User(id=PydanticObjectId("67f766eb9adc7bd24a85e1cd"), email="test")  # type: ignore


router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get(
    "/website_overrides",
    operation_id="get_website_overrides",
    summary="Get website overrides",
    description="Get website overrides",
)
async def get_website_overrides(current_user: User = Depends(get_current_user)) -> list[WebsiteOverride]:
    overrides = await WebsiteOverride.find({WebsiteOverride.owner_id: str(current_user.id)}).to_list()
    return overrides


@router.post(
    "/website_overrides",
    operation_id="post_website_override",
    summary="Post website override",
    description="Post website override",
)
async def post_website_overrides(
    data: WebsiteOverrideCreate, current_user: User = Depends(get_current_user)
) -> WebsiteOverride:
    override = await WebsiteOverride.find_one(
        {WebsiteOverride.owner_id: str(current_user.id), WebsiteOverride.domain: data.domain}
    )
    if override:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Website override already exists")

    profile = await Profile.get(data.profile_id)
    if not profile or profile.owner_id != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    override = WebsiteOverride(owner_id=str(current_user.id), **data.model_dump())
    await override.save()
    return override


@router.get(
    "/website_overrides/{domain}",
    operation_id="get_website_override",
    summary="Get website override",
    description="Get website override",
)
async def get_website_override(domain: str, current_user: User = Depends(get_current_user)) -> WebsiteOverride | None:
    override = await WebsiteOverride.find_one(
        {WebsiteOverride.owner_id: str(current_user.id), WebsiteOverride.domain: domain}
    )
    if not override:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website override not found")
    return override


@router.put(
    "/website_overrides/{domain}",
    operation_id="put_website_override",
    summary="Put website override",
    description="Put website override",
)
async def put_website_override(
    domain: str, data: WebsiteOverrideCreate, current_user: User = Depends(get_current_user)
) -> WebsiteOverride | None:
    logger.debug(data)
    print(domain)
    logger.debug(domain)
    override = await WebsiteOverride.find_one(
        {WebsiteOverride.owner_id: str(current_user.id), WebsiteOverride.domain: domain}
    )
    if not override:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website override not found")

    if override.domain != data.domain:
        existing_with_new_domain = await WebsiteOverride.find_one(
            {WebsiteOverride.owner_id: str(current_user.id), WebsiteOverride.domain: data.domain}
        )
        if existing_with_new_domain:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A website override with the domain '{data.domain}' already exists.",
            )

    profile = await Profile.get(override.profile_id)
    if not profile or profile.owner_id != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    override.domain = data.domain
    override.profile_id = data.profile_id
    override.config = data.config
    override.updated_at = datetime.now()
    await override.save()
    return override


@router.delete(
    "/website_overrides/{domain}",
    operation_id="delete_website_override",
    summary="Delete website override",
    description="Delete website override",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_website_override(domain: str, current_user: User = Depends(get_current_user)) -> None:
    override = await WebsiteOverride.find_one(
        {WebsiteOverride.owner_id: str(current_user.id), WebsiteOverride.domain: domain}
    )
    if override:
        await override.delete()
    return None
