import uuid

import boto3

from backend.api.exceptions import ErrorLocationField
from backend.core.settings import settings
from backend.services.auth.cognito import Cognito
from backend.services.auth.exceptions import AuthException, ErrorCategory
from backend.utils.constants import INTERNAL_SERVER_ERROR_TEXT
from backend.utils.log import logger

cognito_client = boto3.client("cognito-idp", region_name=settings.auth.cognito.region)


def forgot_password(email: str) -> None:
    try:
        cognito = Cognito(
            user_pool_id=settings.auth.cognito.user_pool_id,
            client_id=settings.auth.cognito.client_id,
            username=email,
        )
        cognito.initiate_forgot_password()

    except cognito_client.exceptions.UserNotFoundException as e:
        raise AuthException(
            code="FORGOT_PASSWORD_ERROR_USER_NOT_FOUND",
            message="User not found.",
            category=ErrorCategory.VALIDATION,
            field="email",
        ) from e

    except cognito_client.exceptions.LimitExceededException as e:
        raise AuthException(
            code="FORGOT_PASSWORD_ERROR_LIMIT_EXCEEDED",
            message="Limit exceeded. Try again later.",
            category=ErrorCategory.RATE_LIMIT,
            field=ErrorLocationField.GENERAL,
        ) from e
    except Exception as e:
        unique_error_code = str(uuid.uuid4())
        logger.error(f"code: {unique_error_code}, message: {str(e)}")
        raise AuthException(
            code="INTERNAL_SERVER_ERROR",
            message=INTERNAL_SERVER_ERROR_TEXT.format(unique_error_code=unique_error_code),
            category=ErrorCategory.SERVER_ERROR,
            field=ErrorLocationField.GENERAL,
        ) from e


def confirm_forgot_password(email: str, confirmation_code: str, new_password: str) -> None:
    try:
        cognito = Cognito(
            user_pool_id=settings.auth.cognito.user_pool_id,
            client_id=settings.auth.cognito.client_id,
            username=email,
        )
        cognito.confirm_forgot_password(  # type: ignore
            confirmation_code,
            new_password,
        )

    except (
        cognito_client.exceptions.CodeMismatchException,
        cognito_client.exceptions.ExpiredCodeException,
    ) as e:
        raise AuthException(
            code="CONFIRM_FORGOT_PASSWORD_ERROR_INVALID_CODE",
            message="Invalid or expired confirmation code. Please request a new code and try again.",
            category=ErrorCategory.VALIDATION,
            field="confirmation_code",
        ) from e

    except Exception as e:
        unique_error_code = str(uuid.uuid4())
        logger.error(f"code: {unique_error_code}, message: {str(e)}")
        raise AuthException(
            code="INTERNAL_SERVER_ERROR",
            message=INTERNAL_SERVER_ERROR_TEXT.format(unique_error_code=unique_error_code),
            category=ErrorCategory.SERVER_ERROR,
            field=ErrorLocationField.GENERAL,
        ) from e


def change_password(old_password: str, new_password: str, access_token: str) -> None:
    try:
        cognito = Cognito(
            user_pool_id=settings.auth.cognito.user_pool_id,
            client_id=settings.auth.cognito.client_id,
            access_token=access_token,
        )
        cognito.change_password(  # type: ignore
            old_password,
            new_password,
        )
    except cognito_client.exceptions.NotAuthorizedException as e:
        raise AuthException(
            code="CHANGE_PASSWORD_ERROR_UNAUTHORIZED",
            message="Unable to change password. Please ensure your old password is correct and you're properly signed in.",  # noqa: E501
            category=ErrorCategory.AUTHENTICATION,
            field="old_password",
        ) from e

    except cognito_client.exceptions.InvalidPasswordException as e:
        raise AuthException(
            code="CHANGE_PASSWORD_ERROR_INVALID_PASSWORD",
            message=str(e),
            category=ErrorCategory.VALIDATION,
            field="new_password",
        ) from e
    except Exception as e:
        unique_error_code = str(uuid.uuid4())
        logger.error(f"code: {unique_error_code}, message: {str(e)}")
        raise AuthException(
            code="INTERNAL_SERVER_ERROR",
            message=INTERNAL_SERVER_ERROR_TEXT.format(unique_error_code=unique_error_code),
            category=ErrorCategory.SERVER_ERROR,
            field=ErrorLocationField.GENERAL,
        ) from e


def set_initial_password(username: str, old_password: str, new_password: str) -> None:
    try:
        cognito = Cognito(
            user_pool_id=settings.auth.cognito.user_pool_id,
            client_id=settings.auth.cognito.client_id,
            username=username,
        )
        cognito.new_password_challenge(  # type: ignore
            old_password,
            new_password,
        )

    except Exception as e:
        unique_error_code = str(uuid.uuid4())
        logger.error(f"code: {unique_error_code}, message: {str(e)}")
        raise AuthException(
            code="INTERNAL_SERVER_ERROR",
            message=INTERNAL_SERVER_ERROR_TEXT.format(unique_error_code=unique_error_code),
            category=ErrorCategory.SERVER_ERROR,
            field=ErrorLocationField.GENERAL,
        ) from e
