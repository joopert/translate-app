import uuid

import boto3

from backend.api.exceptions import ErrorLocationField
from backend.core.settings import settings
from backend.services.auth.cognito import Cognito
from backend.services.auth.exceptions import AuthException, ErrorCategory
from backend.utils.constants import INTERNAL_SERVER_ERROR_TEXT
from backend.utils.log import logger

cognito_client = boto3.client("cognito-idp", region_name=settings.auth.cognito.region)


def confirm_sign_up(email: str, confirmation_code: str) -> None:
    try:
        cognito = Cognito(
            user_pool_id=settings.auth.cognito.user_pool_id,
            client_id=settings.auth.cognito.client_id,
            user_pool_region=settings.auth.cognito.region,
            username=email,
        )
        cognito.confirm_sign_up(  # type: ignore
            username=email,
            confirmation_code=confirmation_code,
        )
    except cognito_client.exceptions.CodeMismatchException as e:
        raise AuthException(
            error_code="CONFIRM_SIGN_UP_ERROR_INVALID_VERIFICATION_CODE",
            message="Invalid verification code",
            category=ErrorCategory.VALIDATION,
            field="confirmation_code",
        ) from e

    except cognito_client.exceptions.ExpiredCodeException as e:
        raise AuthException(
            error_code="CONFIRM_SIGN_UP_ERROR_VERIFICATION_CODE_EXPIRED",
            message="Verification code has expired.",
            category=ErrorCategory.VALIDATION,
            field="confirmation_code",
        ) from e

    except cognito_client.exceptions.LimitExceededException as e:
        raise AuthException(
            error_code="CONFIRM_SIGN_UP_ERROR_VERIFICATION_CODE_LIMIT_EXCEEDED",
            message="Verification code limit exceeded. Please try again later.",
            category=ErrorCategory.RATE_LIMIT,
            field="confirmation_code",
        ) from e

    except (Exception, cognito_client.exceptions.NotAuthorizedException) as e:
        unique_error_code = str(uuid.uuid4())
        logger.error(f"code: {unique_error_code}, message: {str(e)}")

        raise AuthException(
            error_code="INTERNAL_SERVER_ERROR",
            message=INTERNAL_SERVER_ERROR_TEXT.format(unique_error_code=unique_error_code),
            category=ErrorCategory.SERVER_ERROR,
            field=ErrorLocationField.GENERAL,
        ) from e

    # TODO: Call handle_user_registration, but we get into async/sync issues.
    # A solution would be to use event bus, so it is called another way.


def resend_confirmation_code(email: str) -> None:
    try:
        cognito = Cognito(
            user_pool_id=settings.auth.cognito.user_pool_id,
            client_id=settings.auth.cognito.client_id,
            user_pool_region=settings.auth.cognito.region,
            username=email,
        )
        cognito.resend_confirmation_code(  # type: ignore
            username=email,
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
