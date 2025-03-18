from enum import Enum


class ErrorLocation(str, Enum):
    BODY = "body"
    QUERY = "query"
    HEADER = "header"
    COOKIES = "cookies"
    PARAMS = "params"


class ErrorLocationField(str, Enum):
    GENERAL = "general"


class ErrorCategory(str, Enum):
    VALIDATION = "validation"  # 400
    AUTHENTICATION = "authentication"  # 401
    AUTHORIZATION = "authorization"  # 403
    NOT_FOUND = "not_found"  # 404
    CONFLICT = "conflict"  # 409
    RATE_LIMIT = "rate_limit"  # 429
    SERVER_ERROR = "server_error"  # 500
