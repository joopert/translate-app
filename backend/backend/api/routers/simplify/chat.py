from uuid import UUID

from fastapi import APIRouter
from pydantic_ai.messages import ToolCallPart

from backend.services.chat import process_chat_message
from backend.services.chat.models import (
    ChatRequest,
    ChatResponse,
    Conversation,
    FrontendMessage,
    StoredMessage,
)

router = APIRouter(prefix="/chat")

conversations_db: dict[UUID, Conversation] = {}
messages_db: dict[UUID, list[StoredMessage]] = {}


@router.post(
    "/public",
    operation_id="chat_post_chat_public",
    summary="Chat Public",
    description="Chat Public.",
)
async def chat_public(request: ChatRequest) -> ChatResponse:
    """
    Chat Public.

    Without authentication.
    # TODO: need to implement rate limit etc.
    """
    latest_message = await process_chat_message(request, conversations_db, messages_db)

    content = "".join(
        [str(part.content) for part in latest_message.message.parts if not isinstance(part, ToolCallPart)]
    )

    frontend_message = FrontendMessage(
        id=latest_message.id,
        kind="response",
        content=content,
    )

    return ChatResponse(
        conversation_id=request.conversation_id,
        message=frontend_message,
    )
