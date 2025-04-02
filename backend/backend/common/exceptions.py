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
    VALIDATION = "validation"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    NOT_FOUND = "not_found"
    CONFLICT = "conflict"
    RATE_LIMIT = "rate_limit"
    SERVER_ERROR = "server_error"
