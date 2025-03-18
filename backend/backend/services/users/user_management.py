"""
User management service layer providing core business logic for user operations.
This centralizes validation and operations related to users separate from API routers.
"""

from typing import TYPE_CHECKING, cast

from backend.core.settings import settings
from backend.services.auth.cognito.user_management import admin_get_user
from backend.services.users.models import User
from backend.services.users.subscription import create_subscription
from backend.utils.log import logger

if TYPE_CHECKING:
    from backend.services.auth.cognito.models import CognitoUser


async def get_user_by_email(email: str) -> User | None:
    """
    Get a user by email, returning None if not found.

    Args:
        email: The user's email address

    Returns:
        User object if found, None otherwise
    """
    return await User.find_by_email(email)


async def create_user(email: str) -> User:
    """
    Create a new user in the database.

    Args:
        email: User's email address

    Returns:
        Newly created user
    """
    logger.debug(f"Trying to create user with email {email}")

    cognito_user = cast("CognitoUser", admin_get_user(email))
    db_user = User(email=email, auth_user_id=cognito_user.id)
    await db_user.save()
    logger.info(f"Created user with email {email}")
    return db_user


# async def update_user(user: User, update_data: dict[str, Any]) -> User:
#     """
#     Update user data with validation.

#     Args:
#         user: User object to update
#         update_data: Dictionary of fields to update

#     Returns:
#         Updated user
#     """
#     # Validate update data (can be expanded based on requirements)
#     validate_user_update(update_data)

#     # Apply updates
#     for field, value in update_data.items():
#         setattr(user, field, value)

#     user.updated_at = datetime.now(UTC)
#     await user.save()
#     logger.info(f"Updated user {user.email}")

#     return user


# def validate_user_update(update_data: dict[str, Any]) -> None:
#     """
#     Centralized validation for user updates.

#     Args:
#         update_data: Dictionary of fields to update

#     Raises:
#         ValueError: If validation fails
#     """
#     # Example validations - expand based on requirements
#     for field, value in update_data.items():
#         if field == "email" and value and "@" not in value:
#             raise ValueError("Invalid email format")


#         # Add more field-specific validations as needed
async def handle_user_registration(email: str, plan_name: str | None = None) -> None:
    """
    Handle user registration after creating a new user auth user.
    It will do the following steps:
    - create a database user
    - Create a subscription
    """
    if plan_name is None and settings.payments.default_plan_name is None:
        raise ValueError("No plan name provided and no default plan name set in settings")
    plan_name = cast(str, plan_name or settings.payments.default_plan_name)

    logger.info(f"Handling user registration for user with email {email} for plan {plan_name}")
    await create_user(email)
    logger.debug(f"Created user with email {email}")
    await create_subscription(email, plan_name)
    logger.debug(f"Created subscription for user with email {email}")

    return None
