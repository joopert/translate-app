# type: ignore
import base64

import boto3
import jwt
from pycognito import Cognito as OriginalCognito
from pycognito.exceptions import TokenVerificationException

from backend.core.settings import settings


def verify_token(self, token, id_name, token_use):
    # taken from pycognito, compute_hash_digest has no a .encode() and bas64 .decode()
    # https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html

    kid = jwt.get_unverified_header(token).get("kid")
    hmac_key = jwt.api_jwk.PyJWK(self.get_key(kid)).key
    required_claims = (["aud"] if token_use != "access" else []) + ["iss", "exp"]  # nosec
    try:
        decoded = jwt.api_jwt.decode_complete(
            token,
            hmac_key,
            algorithms=["RS256"],
            audience=self.client_id if token_use != "access" else None,  # nosec
            issuer=self.user_pool_url,
            options={
                "require": required_claims,
                "verify_iat": False,
            },
        )
    except jwt.PyJWTError as err:
        raise TokenVerificationException(f"Your {id_name!r} token could not be verified ({err}).") from None
    verified, header = decoded["payload"], decoded["header"]

    token_use_verified = verified.get("token_use") == token_use
    if not token_use_verified:
        raise TokenVerificationException(f"Your {id_name!r} token use ({token_use!r}) could not be verified.")

    if (iat := verified.get("iat")) is not None:
        try:
            int(iat)
        except ValueError as execption:
            raise TokenVerificationException(
                f"Your {id_name!r} token's iat claim is not a valid integer."
            ) from execption

    # Compute and verify at_hash (formerly done by python-jose)
    if "at_hash" in verified:
        alg_obj = jwt.get_algorithm_by_name(header["alg"])
        digest = alg_obj.compute_hash_digest(self.access_token.encode("utf-8"))
        at_hash = base64.urlsafe_b64encode(digest[: (len(digest) // 2)]).rstrip(b"=").decode("utf-8")
        if at_hash != verified["at_hash"]:
            raise TokenVerificationException("at_hash claim does not match access_token.")

    setattr(self, id_name, token)
    setattr(self, f"{token_use}_claims", verified)
    return verified


# Singleton Cognito client
_cognito_client = None


class Cognito(OriginalCognito):
    """
    Custom implementation of Cognito with patched token verification.
    See https://github.com/joopert/flightdeals/issues/85.

    The compute_hash_digest expects bytes but gets a string.
    Also uses a shared client instance for better performance.
    """

    verify_token = verify_token

    def __init__(
        self,
        user_pool_id,
        client_id,
        user_pool_region=None,
        username=None,
        id_token=None,
        refresh_token=None,
        access_token=None,
        client_secret=None,
        **kwargs,
    ):
        # Call the parent constructor with minimal arguments
        # and default values where needed
        super().__init__(
            user_pool_id=user_pool_id,
            client_id=client_id,
            user_pool_region=user_pool_region,
            username=username,
            id_token=id_token,
            refresh_token=refresh_token,
            access_token=access_token,
            client_secret=client_secret,
            **kwargs,
        )

        # Override the client with our singleton instance
        self.client = self.get_cognito_client()

    def get_cognito_client(self):
        """
        Returns a singleton Cognito client.
        """
        global _cognito_client

        if _cognito_client is None:
            session = boto3.Session(region_name=settings.auth.cognito.region)
            _cognito_client = session.client("cognito-idp")

        return _cognito_client
