import sys

from loguru import logger

# from backend.core.settings import settings

logger.remove()
logger.add(sys.stderr, level="DEBUG")
