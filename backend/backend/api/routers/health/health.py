from typing import Literal

import whenever
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class Health(BaseModel):
    status: Literal["OK", "ERROR"] = "OK"
    timestamp: str = Field(description="UTC timestamp in ISO 8601 format", examples=["2023-12-25T12:34:56Z"])


@router.get("/", operation_id="health_get_health", summary="Health check", description="Health check")
async def health_check() -> Health:
    return Health(timestamp=str(whenever.Instant.now()))
