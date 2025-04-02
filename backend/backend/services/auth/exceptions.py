from backend.common.exceptions import ErrorCategory, ErrorLocation


class BackendException(Exception):
    def __init__(
        self,
        error_code: str,
        message: str,
        category: ErrorCategory,
        field: str,
        location: ErrorLocation | None = None,
    ):
        self.error_code = error_code
        self.message = message
        self.category = category
        self.field = field
        self.location = location or ErrorLocation.BODY
        super().__init__(message)


class AuthException(BackendException):
    def __init__(
        self,
        error_code: str,
        message: str,
        category: ErrorCategory,
        field: str,
        location: ErrorLocation | None = None,
    ):
        super().__init__(error_code, message, category, field, location)
