from datetime import UTC, datetime
from typing import Union

from beanie import Document
from pydantic import Field


class User(Document):
    email: str  # we just always register with email.
    # Even though someone might change it's username later to something else
    auth_user_id: str | None = None
    payment_customer_id: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    @classmethod
    async def find_by_email(cls, email: str) -> Union["User", None]:
        return await cls.find_one(cls.email == email)

    class Settings:
        name = "users"
        indexes = [
            "email",
            "auth_user_id",
        ]
