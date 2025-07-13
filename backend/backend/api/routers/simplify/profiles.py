from datetime import datetime

from beanie.odm.fields import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, status

# from backend.api.routers.auth.dependencies import get_current_user
from backend.api.routers.simplify.models import WebsiteOverride
from backend.services.users.models import User

from .models import Profile, ProfileIn


async def get_current_user():  # TODO: remove this!
    return User(id=PydanticObjectId("67f766eb9adc7bd24a85e1cd"), email="test")  # type: ignore


router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get(
    "/profiles",
    operation_id="get_profiles",
    summary="Get profiles",
    description="Get profiles",
)
async def get_profiles(current_user: User = Depends(get_current_user)) -> list[Profile]:
    profiles = await Profile.find({Profile.owner_id: str(current_user.id)}).to_list()
    return profiles


@router.post(
    "/profiles",
    operation_id="post_profile",
    summary="Post profile",
    description="Post profile",
)
async def post_profile(data: ProfileIn, current_user: User = Depends(get_current_user)) -> Profile:
    profile = await Profile.find_one({Profile.owner_id: str(current_user.id), Profile.name: data.name})
    if profile:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Profile already exists")

    profile = Profile(owner_id=str(current_user.id), **data.model_dump())
    await profile.save()
    return profile


@router.get(
    "/profiles/{name}",
    operation_id="get_profile",
    summary="Get profile",
    description="Get profile",
)
async def get_profile(name: str, current_user: User = Depends(get_current_user)) -> Profile | None:
    profile = await Profile.find_one({Profile.owner_id: str(current_user.id), Profile.name: name})
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


@router.put(
    "/profiles/{name}",
    operation_id="put_profile",
    summary="Put profile",
    description="Put profile",
)
async def put_profile(name: str, data: ProfileIn, current_user: User = Depends(get_current_user)) -> Profile | None:
    profile = await Profile.find_one({Profile.owner_id: str(current_user.id), Profile.name: name})
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    if profile.name != data.name:
        existing_with_new_name = await Profile.find_one(
            {Profile.owner_id: str(current_user.id), Profile.name: data.name}
        )
        if existing_with_new_name:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail=f"A profile with the name '{data.name}' already exists."
            )

    profile.name = data.name
    profile.config = data.config
    profile.updated_at = datetime.now()

    await profile.save()
    return profile


@router.delete(
    "/profiles/{name}",
    operation_id="delete_profile",
    summary="Delete profile",
    description="Delete profile",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_profile(name: str, current_user: User = Depends(get_current_user)) -> None:
    profile = await Profile.find_one({Profile.owner_id: str(current_user.id), Profile.name: name})
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    overrides = await WebsiteOverride.find({"owner_id": str(current_user.id), "profile_id": str(profile.id)}).to_list()
    if overrides:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Profile is in use by the following website overrides: "
            + ", ".join([override.domain for override in overrides]),
        )

    await profile.delete()
    return None
