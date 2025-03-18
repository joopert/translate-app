from enum import Enum


class Environment(str, Enum):
    LOCAL = "local"
    DEV = "dev"
    TEST = "test"
    ACC = "acc"
    PROD = "prod"


class LogLevels(str, Enum):
    # cannot put this in backend.utils.log because of circular import
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"
    TRACE = "TRACE"
