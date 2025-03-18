from beanie import init_beanie  # type: ignore
from motor.motor_asyncio import AsyncIOMotorClient

from backend.core.settings import settings
from backend.services.users.models import User
from backend.services.users.subscription import Subscription


async def init_db():
    client = AsyncIOMotorClient(  # type: ignore
        settings.db_uri,
        serverSelectionTimeoutMS=settings.db_connection_timeout,
    )
    database = client[settings.db_name]  # type: ignore
    await init_beanie(
        database=database,
        document_models=[User, Subscription],
        allow_index_dropping=True,
    )
