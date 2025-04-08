import traceback
import uuid

import boto3

from backend.api.exceptions import ErrorLocationField
from backend.core.settings import settings
from backend.services.auth.cognito import Cognito
from backend.services.auth.exceptions import AuthException, ErrorCategory
from backend.services.auth.models import Tokens
from backend.utils.constants import INTERNAL_SERVER_ERROR_TEXT
from backend.utils.log import logger

cognito_client = boto3.client("cognito-idp", region_name=settings.auth.cognito.region)


def authenticate(username: str, password: str) -> Tokens:
    try:
        cognito = Cognito(
            user_pool_id=settings.auth.cognito.user_pool_id,
            client_id=settings.auth.cognito.client_id,
            user_pool_region=settings.auth.cognito.region,
            username=username,
        )

        cognito.authenticate(password=password)  # type: ignore
    except cognito_client.exceptions.NotAuthorizedException as e:
        raise AuthException(
            error_code="INVALID_CREDENTIALS",
            message="Invalid credentials",
            category=ErrorCategory.AUTHENTICATION,
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

    tokens = Tokens(
        access_token=cognito.access_token,  # type: ignore
        refresh_token=cognito.refresh_token,  # type: ignore
        id_token=cognito.id_token,  # type: ignore
    )
    return tokens


def refresh_token(refresh_token: str | None) -> Tokens:
    if not refresh_token:
        raise AuthException(
            error_code="NO_REFRESH_TOKEN",
            message="No refresh token provided",
            category=ErrorCategory.AUTHENTICATION,
            field=ErrorLocationField.GENERAL,
        )

    try:
        cognito = Cognito(
            user_pool_id=settings.auth.cognito.user_pool_id,
            client_id=settings.auth.cognito.client_id,
            refresh_token=refresh_token,
        )

        cognito.renew_access_token()

    except Exception as e:
        unique_error_code = str(uuid.uuid4())
        logger.error(f"code: {unique_error_code}, message: {str(e)}")
        logger.error(traceback.format_exc())

        raise AuthException(
            error_code="INTERNAL_SERVER_ERROR",
            message=INTERNAL_SERVER_ERROR_TEXT.format(unique_error_code=unique_error_code),
            category=ErrorCategory.SERVER_ERROR,
            field=ErrorLocationField.GENERAL,
        ) from e

    tokens = Tokens(
        access_token=cognito.access_token,  # type: ignore
        refresh_token=cognito.refresh_token,  # type: ignore
        id_token=cognito.id_token,  # type: ignore
    )
    return tokens
