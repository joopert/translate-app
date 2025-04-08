import uuid

from backend.api.exceptions import ErrorLocationField
from backend.core.settings import settings
from backend.services.auth.cognito import Cognito
from backend.services.auth.exceptions import AuthException, ErrorCategory
from backend.utils.constants import INTERNAL_SERVER_ERROR_TEXT
from backend.utils.log import logger


def forgot_password(email: str) -> None:
    cognito = Cognito(
        user_pool_id=settings.auth.cognito.user_pool_id,
        client_id=settings.auth.cognito.client_id,
        username=email,
    )
    try:
        cognito.initiate_forgot_password()

    except cognito.client.exceptions.UserNotFoundException as e:
        logger.debug(f"User not found: {str(e)}")
        pass
        # we do not raise, because we do not want to expose this from security perspective.

    except cognito.client.exceptions.LimitExceededException as e:
        raise AuthException(
            error_code="FORGOT_PASSWORD_ERROR_LIMIT_EXCEEDED",
            message="Limit exceeded. Try again later.",
            category=ErrorCategory.RATE_LIMIT,
            field=ErrorLocationField.GENERAL,
        ) from e
    except Exception as e:
        unique_error_code = str(uuid.uuid4())
        logger.error(f"code: {unique_error_code}, message: {str(e)}")
        raise AuthException(
            error_code="INTERNAL_SERVER_ERROR",
            message=INTERNAL_SERVER_ERROR_TEXT.format(unique_error_code=unique_error_code),
            category=ErrorCategory.SERVER_ERROR,
            field=ErrorLocationField.GENERAL,
        ) from e


def confirm_forgot_password(email: str, confirmation_code: str, new_password: str) -> None:
    cognito = Cognito(
        user_pool_id=settings.auth.cognito.user_pool_id,
        client_id=settings.auth.cognito.client_id,
        username=email,
    )
    try:
        cognito.confirm_forgot_password(  # type: ignore
            confirmation_code,
            new_password,
        )

    except (
        cognito.client.exceptions.CodeMismatchException,
        cognito.client.exceptions.ExpiredCodeException,
    ) as e:
        raise AuthException(
            error_code="CONFIRM_FORGOT_PASSWORD_ERROR_INVALID_CODE",
            message="Invalid or expired confirmation code. Please request a new code and try again.",
            category=ErrorCategory.VALIDATION,
            field="confirmation_code",
        ) from e
    except cognito.client.exceptions.InvalidPasswordException as e:
        raise AuthException(
            error_code="CHANGE_PASSWORD_ERROR_INVALID_PASSWORD",
            message=str(e),
            category=ErrorCategory.VALIDATION,
            field="new_password",
        ) from e
    except cognito.client.exceptions.LimitExceededException as e:
        raise AuthException(
            error_code="FORGOT_PASSWORD_ERROR_LIMIT_EXCEEDED",
            message="Please try again later. Too many requests have been sent.",
            category=ErrorCategory.RATE_LIMIT,
            field=ErrorLocationField.GENERAL,
        ) from e
    except Exception as e:
        unique_error_code = str(uuid.uuid4())
        logger.error(f"code: {unique_error_code}, message: {str(e)}")
        raise AuthException(
            error_code="INTERNAL_SERVER_ERROR",
            message=INTERNAL_SERVER_ERROR_TEXT.format(unique_error_code=unique_error_code),
            category=ErrorCategory.SERVER_ERROR,
            field=ErrorLocationField.GENERAL,
        ) from e


def change_password(old_password: str, new_password: str, access_token: str) -> None:
    cognito = Cognito(
        user_pool_id=settings.auth.cognito.user_pool_id,
        client_id=settings.auth.cognito.client_id,
        access_token=access_token,
    )

    try:
        cognito.change_password(  # type: ignore
            old_password,
            new_password,
        )
    except cognito.client.exceptions.NotAuthorizedException as e:
        raise AuthException(
            error_code="CHANGE_PASSWORD_ERROR_UNAUTHORIZED",
            message="Unable to change password. Please ensure your old password is correct and you're properly signed in.",  # noqa: E501
            category=ErrorCategory.AUTHENTICATION,
            field="old_password",
        ) from e

    except cognito.client.exceptions.InvalidPasswordException as e:
        raise AuthException(
            error_code="CHANGE_PASSWORD_ERROR_INVALID_PASSWORD",
            message=str(e),
            category=ErrorCategory.VALIDATION,
            field="new_password",
        ) from e
    except Exception as e:
        unique_error_code = str(uuid.uuid4())
        logger.error(f"code: {unique_error_code}, message: {str(e)}")
        raise AuthException(
            error_code="INTERNAL_SERVER_ERROR",
            message=INTERNAL_SERVER_ERROR_TEXT.format(unique_error_code=unique_error_code),
            category=ErrorCategory.SERVER_ERROR,
            field=ErrorLocationField.GENERAL,
        ) from e


def set_initial_password(username: str, old_password: str, new_password: str) -> None:
    cognito = Cognito(
        user_pool_id=settings.auth.cognito.user_pool_id,
        client_id=settings.auth.cognito.client_id,
        username=username,
    )
    try:
        cognito.new_password_challenge(  # type: ignore
            old_password,
            new_password,
        )

    except Exception as e:
        unique_error_code = str(uuid.uuid4())
        logger.error(f"code: {unique_error_code}, message: {str(e)}")
        raise AuthException(
            error_code="INTERNAL_SERVER_ERROR",
            message=INTERNAL_SERVER_ERROR_TEXT.format(unique_error_code=unique_error_code),
            category=ErrorCategory.SERVER_ERROR,
            field=ErrorLocationField.GENERAL,
        ) from e
