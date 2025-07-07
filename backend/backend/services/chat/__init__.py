from datetime import UTC, datetime
from uuid import UUID, uuid4

from pydantic_ai import Agent

from backend.prompts import get_template
from backend.utils.log import logger

from .models import ChatRequest, Conversation, StoredMessage


async def process_chat_message(
    request: ChatRequest,
    conversations_db: dict[UUID, Conversation],
    messages_db: dict[UUID, list[StoredMessage]],
) -> StoredMessage:
    conversation_id = request.conversation_id
    instructions = None
    conversation = conversations_db.get(conversation_id)

    if not conversation:
        # On the first message, create the conversation and add the system prompt.
        conversations_db[conversation_id] = Conversation(conversation_id=conversation_id, config=request.config)
        instructions = get_template("main", request.config.model_dump())
        messages_db[conversation_id] = []
    elif conversation.config != request.config:
        # When the config changes during the conversation, update the conversation and load the new template.
        conversation.config = request.config
        instructions = get_template("main", request.config.model_dump())

    # Extract the history of ModelMessage objects for the agent.
    message_history = [stored.message for stored in messages_db.get(conversation_id, [])]

    chat_agent = Agent(
        "bedrock:eu.amazon.nova-lite-v1:0",
        instructions=instructions,
        # "bedrock:eu.anthropic.claude-3-haiku-20240307-v1:0",
    )

    ai_response = await chat_agent.run(
        user_prompt=request.message,
        message_history=message_history,
    )

    new_messages = ai_response.new_messages()
    if len(new_messages) != 2:
        logger.error(f"Agent returned unexpected number of messages: {len(new_messages)}. Expected 2.")
        raise ValueError("Agent returned unexpected number of messages: {len(new_messages)}. Expected 2.")

    user_message, ai_message = new_messages
    messages_db[conversation_id].append(StoredMessage(id=request.message_id, message=user_message))
    latest_message = StoredMessage(id=uuid4(), message=ai_message)
    messages_db[conversation_id].append(latest_message)

    conversations_db[conversation_id].last_message_at = datetime.now(UTC)

    return latest_message
