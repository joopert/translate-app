from enum import Enum
from typing import Literal

from pydantic import BaseModel, SecretStr


class PaymentProvider(BaseModel):
    api_key: SecretStr
    webhook_secret: SecretStr
    environment: Literal["sandbox", "production"] = "production"
    url_endpoint: str = "fix it"
    plans_refresh_interval_hours: int = 24
    default_plan_name: str | None = None
    trial_period_days: int = 7


class PaymentEventType(Enum):
    """Generic payment event types that map to various provider events"""

    PAYMENT_SUCCEEDED = "payment_succeeded"
    PAYMENT_FAILED = "payment_failed"
    SUBSCRIPTION_CREATED = "subscription_created"
    SUBSCRIPTION_CANCELLED = "subscription_cancelled"
    SUBSCRIPTION_PAYMENT_SUCCEEDED = "subscription_payment_succeeded"
    SUBSCRIPTION_PAYMENT_FAILED = "subscription_payment_failed"
    CHECKOUT_COMPLETED = "checkout_completed"
    CHECKOUT_ABANDONED = "checkout_abandoned"


class Payment(BaseModel):
    user_id: str
    plan_id: str
    status: Literal["pending", "successful", "failed", "refunded"]
    subscription_id: str | None = None
    event_type: PaymentEventType


class Plan(BaseModel):
    """Plan model."""

    id: str
    name: str
    description: str | None = None

    def __str__(self) -> str:
        """String representation of the plan."""
        return f"{self.name} ({self.id})"


class Plans(BaseModel):
    """Collection of plans."""

    items: list[Plan]

    def get_plan_by_id(self, plan_id: str) -> Plan | None:
        """
        Get a plan by its ID.

        Args:
            plan_id: The ID of the plan to get.

        Returns:
            The plan with the given ID.

        Raises:
            ValueError: If no plan with the given ID exists.
        """
        for plan in self.items:
            if plan.id == plan_id:
                return plan
        return None

    def find_by_name(self, name: str) -> Plan | None:
        """
        Find a plan by its name.

        Args:
            name: The name of the plan to find.

        Returns:
            The plan with the given name.
        """
        for plan in self.items:
            if plan.name == name:
                return plan
        return None
