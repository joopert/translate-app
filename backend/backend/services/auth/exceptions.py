from backend.common.exceptions import ErrorCategory, ErrorLocation


class AuthException(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        category: ErrorCategory,
        field: str,
        location: ErrorLocation | None = None,
    ):
        self.code = code
        self.message = message
        self.category = category
        self.field = field
        self.location = location or ErrorLocation.BODY
        super().__init__(message)
