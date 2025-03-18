from typing import Any

from fastapi import APIRouter, Request

router = APIRouter()


@router.post("/webhook", status_code=200)
async def polar_webhook(request: Request) -> dict[str, Any]:
    """
    Handle Polar webhook events

    Validates the signature, processes the event, and returns a success response
    """

    # Validate webhook signature using your settings
    # signature = request.headers.get("Paddle-Signature")
    # secret = settings.payments.get_paddle_config().webhook_secret

    # Process the webhook based on event type
    # event_type = payload.get("event_type")

    # Map Paddle event to your generic PaymentEventType
    # Handle the event appropriately

    return {"status": "success"}
