import uuid
from typing import Any, cast

import boto3
from asyncer import asyncify
from botocore.exceptions import ClientError
from pycognito.exceptions import TokenVerificationException  # type: ignore[import]
from pydantic import SecretStr

from backend.api.exceptions import ErrorLocationField
from backend.api.routers.auth.models import (
    CognitoUser,
    CurrentUser,
    SignUp,
)
from backend.core.settings import settings
from backend.services.auth.cognito import Cognito
from backend.services.auth.exceptions import AuthException, ErrorCategory
from backend.services.auth.helpers import generate_password
from backend.utils.constants import INTERNAL_SERVER_ERROR_TEXT
from backend.utils.log import logger

cognito_client = boto3.client("cognito-idp", region_name=settings.auth.cognito.region)


def get_cognito_user(username: str) -> CognitoUser | None:
    cognito = Cognito(
        user_pool_id=settings.auth.cognito.user_pool_id,
        client_id=settings.auth.cognito.client_id,
        user_pool_region=settings.auth.cognito.region,
        username=username,
    )
    try:
        user_info: Any = cognito.admin_get_user()  # type: ignore[attr-defined]
    except cognito_client.exceptions.UserNotFoundException:
        return None

    return CognitoUser(
        id=user_info.sub,
        username=user_info._metadata.get("username"),
        email=user_info._data["email"],
        email_is_verified=user_info.email_verified,
        groups=user_info._data.get("cognito:groups", []),
        picture=user_info._data.get("picture"),
        first_name=user_info._data.get("given_name"),
        last_name=user_info._data.get("family_name"),
        phone_number=user_info._data.get("phone_number"),
        phone_number_is_verified=user_info.phone_number_verified,
    )


def create_user(email: str, password: str) -> None:
    """
    Create a user in Cognito.

    Args:
        email: User's email
        password: User's password

    Returns:
        Dictionary with Cognito response
    """
    try:
        cognito = Cognito(
            user_pool_id=settings.auth.cognito.user_pool_id,
            client_id=settings.auth.cognito.client_id,
            user_pool_region=settings.auth.cognito.region,
            username=email,
        )

        cognito.register(  # type: ignore
            username=email,
            password=password,
        )

        logger.info(f"Created Cognito user with email {email}")
        # TODO: we could improve by directly getting the user, and returning that.
        return None

    except cognito_client.exceptions.UsernameExistsException as e:
        raise AuthException(
            error_code="SIGN_UP_ERROR_USERNAME_EXISTS",
            message="An account with the provided credentials already exists. Please try a different username.",
            category=ErrorCategory.CONFLICT,
            field="email",
        ) from e
    except cognito_client.exceptions.InvalidPasswordException as e:
        raise AuthException(
            error_code="SIGN_UP_ERROR_INVALID_PASSWORD",
            message=str(e),
            category=ErrorCategory.VALIDATION,
            field="password",
        ) from e
    except cognito_client.exceptions.InvalidParameterException as e:
        raise AuthException(
            error_code="SIGN_UP_ERROR_INVALID_PARAMETER",
            message=str(e),
            category=ErrorCategory.VALIDATION,
            field="password",
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


def admin_create_user(email: str) -> CognitoUser:
    """
    Creates a new user in the Cognito user pool with a temporary password.
    Args:
        userdata (User): The user to be created.
    Returns:
        bool: True if the user is successfully created.
    """
    user = SignUp(
        email=email,
        password=SecretStr(generate_password()),
    )

    try:
        cognito = Cognito(
            user_pool_id=settings.auth.cognito.user_pool_id,
            client_id=settings.auth.cognito.client_id,
            user_pool_region=settings.auth.cognito.region,
            username=user.email,
        )

        user = cognito.admin_create_user(  # type: ignore
            user.email,
            temporary_password=user.password.get_secret_value(),
        )
    except cognito_client.exceptions.InvalidPasswordException:
        pass  # TODO: need to fix this ... as this is internal error.

    cognito_user = cast(CognitoUser, get_cognito_user(email))

    from backend.services.users.user_management import handle_user_registration
    # TODO: we want to get this directly, but we have a circular dependency
    # TODO: if we would use an event bus (e.g. auth.user_created), we do not need this

    # TODO: this might not work when called from fastapi.
    # Because that is async, then this is sync, and call async again
    asyncify(handle_user_registration)(email)

    return cognito_user


def admin_get_user(username: str) -> CognitoUser | None:
    cognito = Cognito(
        user_pool_id=settings.auth.cognito.user_pool_id,
        client_id=settings.auth.cognito.client_id,
        user_pool_region=settings.auth.cognito.region,
        username=username,
    )
    try:
        logger.debug(f"Trying to get user with username {username}")
        user_info: Any = cognito.admin_get_user()  # type: ignore[attr-defined]
    except cognito_client.exceptions.UserNotFoundException:  # type: ignore[attr-defined]
        return None

    return CognitoUser(
        id=user_info.sub,
        username=user_info._metadata.get("username"),
        email=user_info._data["email"],
        email_is_verified=user_info.email_verified,
        groups=user_info._data.get("cognito:groups", []),
        picture=user_info._data.get("picture"),
        first_name=user_info._data.get("given_name"),
        last_name=user_info._data.get("family_name"),
        phone_number=user_info._data.get("phone_number"),
        phone_number_is_verified=user_info.phone_number_verified,
    )


def get_current_user(access_token: str, id_token: str | None = None) -> CurrentUser:
    try:
        cognito = Cognito(
            user_pool_id=settings.auth.cognito.user_pool_id,
            client_id=settings.auth.cognito.client_id,
            user_pool_region=settings.auth.cognito.region,
            access_token=access_token,
            id_token=id_token,
        )

        access_token_content = cognito.verify_token(  # type: ignore
            access_token, "access_token", "access"
        )
        if id_token:
            id_token_content = cognito.verify_token(id_token, "id_token", "id")  # type: ignore
            return CurrentUser(
                id=access_token_content["sub"],
                access_token=SecretStr(access_token),
                username=id_token_content["cognito:username"],
                email=id_token_content["email"],
                email_is_verified=id_token_content["email_verified"],
                groups=id_token_content.get("cognito:groups", []),
                picture=id_token_content.get("picture"),
                first_name=id_token_content.get("given_name"),
                last_name=id_token_content.get("family_name"),
                phone_number=id_token_content.get("phone_number"),
                phone_number_is_verified=id_token_content.get("phone_number_verified"),
            )

        else:
            user_info: Any = cognito.get_user()  # pyright: ignore[reportUnknownMemberType]
            return CurrentUser(
                id=access_token_content["sub"],
                access_token=SecretStr(access_token),
                username=user_info._metadata.get("username"),
                email=user_info._data["email"],
                email_is_verified=user_info.email_verified,
                groups=user_info._data.get("cognito:groups", []),
                picture=user_info._data.get("picture"),
                first_name=user_info._data.get("given_name"),
                last_name=user_info._data.get("family_name"),
                phone_number=user_info._data.get("phone_number"),
                phone_number_is_verified=user_info.phone_number_verified,
            )

    except TokenVerificationException as e:
        if "Signature has expired" in str(e):
            raise AuthException(
                error_code="TOKEN_EXPIRED",
                message="Token expired",
                category=ErrorCategory.AUTHENTICATION,
                field=ErrorLocationField.GENERAL,
            ) from e

        raise AuthException(
            error_code="INVALID_TOKEN",
            message="Invalid token",
            category=ErrorCategory.AUTHENTICATION,
            field=ErrorLocationField.GENERAL,
        ) from e

    except cognito_client.exceptions.NotAuthorizedException as e:
        raise AuthException(
            error_code="INVALID_TOKEN",
            message="Invalid token",
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


def cognito_logout(refresh_token: str) -> None:
    try:
        cognito = Cognito(
            user_pool_id=settings.auth.cognito.user_pool_id,
            client_id=settings.auth.cognito.client_id,
            refresh_token=refresh_token,
        )
        cognito.client.revoke_token(Token=refresh_token, ClientId=settings.auth.cognito.client_id)  # type: ignore

    except ClientError as e:
        raise AuthException(
            category=ErrorCategory.AUTHENTICATION,
            field=ErrorLocationField.GENERAL,
            error_code="LOGOUT_ERROR_REVOKE_TOKEN",
            message=f"Failed to logout from device: {str(e)}",
        ) from e
