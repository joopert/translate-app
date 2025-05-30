import boto3
from fastapi import APIRouter

from backend.api.routers.auth.models import (
    ConfirmSignUp,
    ResendConfirmationCode,
    ResponseFormat,
    SignUp,
)
from backend.core.settings import settings
from backend.services.auth.cognito.user_management import create_user
from backend.services.auth.cognito.verification import confirm_sign_up as cognito_confirm_signup
from backend.services.auth.cognito.verification import resend_confirmation_code as cognito_resend_confirmation_code
from backend.services.users.user_management import handle_user_registration

router = APIRouter()
cognito_client = boto3.client("cognito-idp", region_name=settings.auth.cognito.region)


@router.post(
    "/sign-up", operation_id="auth_post_sign_up", summary="Register a new user", description="Register a new user"
)
async def signup(user: SignUp) -> ResponseFormat:
    create_user(user.email, user.password.get_secret_value())
    return ResponseFormat(code="SIGN_UP_SUCCESS", msg="User registered successfully")


@router.post(
    "/confirm-sign-up",
    operation_id="auth_post_confirm_sign_up",
    summary="Confirm user registration",
    description="Confirm user registration",
)
async def confirm_sign_up(confirm_data: ConfirmSignUp) -> ResponseFormat:
    cognito_confirm_signup(confirm_data.email, confirm_data.confirmation_code)
    await handle_user_registration(confirm_data.email)

    return ResponseFormat(
        code="CONFIRM_SIGN_UP_SUCCESS",
        msg="Sign up confirmed successfully",
    )


@router.post(
    "/resend-confirmation-code",
    operation_id="auth_post_resend_confirmation_code",
    summary="Resend confirmation code",
    description="Resend confirmation code",
)
async def resend_confirmation_code(resend_data: ResendConfirmationCode) -> ResponseFormat:
    cognito_resend_confirmation_code(resend_data.email)

    return ResponseFormat(
        code="RESEND_CONFIRMATION_CODE_SUCCESS",
        msg="Confirmation code resent successfully",
    )


# async def admin_update_profile(
#     userdata: CognitoUser, attrs: dict[str, Any], attr_map: dict[str, str] | None = None
# ) -> CognitoUser:
#     """
#     Updates a user's profile in the Cognito user pool.
#     Args:
#         userdata (CognitoUser): The user to be updated.
#         attrs (dict[str, Any]): A dictionary of attributes to update.
#         attr_map (dict[str, str], optional): A dictionary of attribute mappings.
#             Defaults to None.
#     Returns:
#         CognitoUser: The updated user.
#     """
#     cognito = Cognito(
#         user_pool_id=settings.auth.cognito.user_pool_id,
#         client_id=settings.auth.cognito.client_id,
#         user_pool_region=settings.auth.cognito.region,
#         username=userdata.email,
#     )

#     cognito.admin_update_profile(  # type: ignore
#         attrs,
#         attr_map=attr_map,
#     )

#     # Since userdata is filled in, the user must exist so we will never return None.
#     return cast(CognitoUser, get_cognito_user(userdata.email))
