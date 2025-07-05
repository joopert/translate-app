from datetime import UTC, datetime
from typing import Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, Field
from pydantic_ai.messages import ModelMessage

from backend.api.routers.simplify.models import Config


class Conversation(BaseModel):
    conversation_id: UUID = Field(default_factory=uuid4)
    config: Config
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    last_message_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    message_count: int = 0


class FrontendMessage(BaseModel):
    id: UUID
    kind: Literal["request", "response"]
    content: str


class StoredMessage(BaseModel):
    id: UUID
    message: ModelMessage


class ChatRequest(BaseModel):
    conversation_id: UUID
    message_id: UUID
    message: str
    config: Config


class ChatResponse(BaseModel):
    conversation_id: UUID
    message: FrontendMessage
