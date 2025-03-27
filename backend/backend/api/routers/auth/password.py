from fastapi import APIRouter, Depends

from backend.api.exceptions import map_auth_exception_to_http
from backend.services.auth.cognito.password_management import change_password as cognito_change_password
from backend.services.auth.cognito.password_management import confirm_forgot_password as cognito_confirm_forgot_password
from backend.services.auth.cognito.password_management import forgot_password as cognito_forgot_password
from backend.services.auth.cognito.password_management import set_initial_password as cognito_set_initial_password
from backend.services.auth.exceptions import AuthException

from .dependencies import get_current_user
from .models import (
    ChangePassword,
    ConfirmForgotPassword,
    CurrentUser,
    ForgotPassword,
    ResponseFormat,
)

router = APIRouter()


@router.post(
    "/forgot-password",
    operation_id="auth_post_forgot_password",
    summary="Forgot password",
    description="Forgot password",
)
async def forgot_passwords(forgot_data: ForgotPassword) -> ResponseFormat:
    try:
        cognito_forgot_password(forgot_data.email)
    except AuthException as e:
        raise map_auth_exception_to_http(e) from e

    return ResponseFormat(
        code="FORGOT_PASSWORD_SUCCESS",
        msg="If an account exists for the provided email address, you will receive password reset instructions.",
    )


@router.post(
    "/confirm-forgot-password",
    operation_id="auth_post_confirm_forgot_password",
    summary="Confirm forgot password",
    description="Confirm forgot password",
)
async def confirm_forgot_password(
    confirm_data: ConfirmForgotPassword,
) -> ResponseFormat:
    try:
        cognito_confirm_forgot_password(
            confirm_data.email, confirm_data.confirmation_code, confirm_data.new_password.get_secret_value()
        )
    except AuthException as e:
        raise map_auth_exception_to_http(e) from e

    return ResponseFormat(
        code="CONFIRM_FORGOT_PASSWORD_SUCCESS",
        msg="Password changed successfully.",
    )


@router.post(
    "/change-password",
    operation_id="auth_post_change_password",
    summary="Change password",
    description="Change password",
)
async def change_password(
    change_data: ChangePassword, current_user: CurrentUser = Depends(get_current_user)
) -> ResponseFormat:
    try:
        cognito_change_password(
            change_data.old_password.get_secret_value(),
            change_data.new_password.get_secret_value(),
            current_user.access_token.get_secret_value(),
        )
    except AuthException as e:
        raise map_auth_exception_to_http(e) from e

    return ResponseFormat(
        code="CHANGE_PASSWORD_SUCCESS",
        msg="Password changed successfully",
    )


@router.post(
    "/set-initial-password",
    operation_id="auth_post_set_initial_password",
    summary="Set initial password",
    description="Set initial password",
)
async def set_initial_password(username: str, old_password: str, new_password: str):
    try:
        cognito_set_initial_password(username, old_password, new_password)
    except AuthException as e:
        raise map_auth_exception_to_http(e) from e
    return ResponseFormat(
        code="CHANGE_PASSWORD_SUCCESS",
        msg="Password changed successfully",
    )
