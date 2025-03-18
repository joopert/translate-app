from fastapi import APIRouter, Depends, HTTPException

from backend.api.exceptions import Detail, ErrorLocationField
from backend.api.routers.auth.dependencies import get_current_user
from backend.api.routers.auth.models import CurrentUser
from backend.services.users.models import User

router = APIRouter()


@router.get("/me", response_model=User)
async def get_current_user_profile(current_user: CurrentUser = Depends(get_current_user)) -> User:
    """
    Get the current user's profile from the database.

    Args:
        current_user (CurrentUser): The current authenticated user from Cognito

    Returns:
        User: The user's database profile
    """
    user = await User.find_by_email(current_user.email)
    if not user:
        # This shouldn't happen in normal operation, but handle it gracefully
        raise HTTPException(
            status_code=404,
            detail=Detail(
                loc=ErrorLocationField.GENERAL,
                code="USER_NOT_FOUND",
                msg="User profile not found. Please contact support.",
            ).model_dump(),
        )
    return user


# @router.patch("/profile", response_model=User)
# def update_user_profile(profile_data: UserProfile, current_user: CurrentUser = Depends(get_current_user)) -> User:
#     """
#     Update the current user's profile information.

#     Args:
#         profile_data (UserProfile): New profile data to update
#         current_user (CurrentUser): The current authenticated user

#     Returns:
#         User: The updated user profile
#     """
#     user = await User.find_by_email(current_user.email)
#     if not user:
#         raise HTTPException(
#             status_code=404,
#             detail=Detail(
#                 loc=ErrorLocationField.GENERAL,
#                 code="USER_NOT_FOUND",
#                 msg="User profile not found. Please contact support.",
#             ).model_dump(),
#         )

#     # Update user fields from profile data
#     # Only update fields that are provided and not None
#     update_data = profile_data.model_dump(exclude_unset=True, exclude_none=True)
#     if update_data:
#         # Apply updates to the user model
#         for field, value in update_data.items():
#             setattr(user, field, value)

#         await user.save()

#     return user
