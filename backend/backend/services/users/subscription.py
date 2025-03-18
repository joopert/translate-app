from datetime import datetime
from enum import Enum

from beanie import Document, Link
from pydantic import model_validator
from whenever import Instant

from backend.api.routers.payments.models import Plan
from backend.core.settings import settings
from backend.services.payments.plans import get_plans_manager
from backend.services.users.models import User
from backend.utils.beanie_helpers import create_link_beanie_workaround
from backend.utils.log import logger


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    TRIALING = "trialing"


class Subscription(Document):
    """User subscription model."""

    user: Link[User]
    plan: Plan
    status: SubscriptionStatus = SubscriptionStatus.TRIALING
    trial_ends_at: datetime | None = None

    class Settings:
        name = "subscriptions"
        use_cache = True
        cache_capacity = 500

    def is_active(self) -> bool:
        """Check if the subscription is active."""
        return self.status in [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING]

    def is_trialing(self) -> bool:
        """Check if the subscription is in trial period."""
        return self.status == SubscriptionStatus.TRIALING

    @model_validator(mode="after")
    def set_trial_end_date(self) -> "Subscription":
        """Set trial end date when status is TRIALING."""
        if self.status == SubscriptionStatus.TRIALING and self.trial_ends_at is None:
            self.trial_ends_at = Instant.now().add(hours=settings.payments.trial_period_days * 24).py_datetime()
        return self


async def create_subscription(email: str, plan_name: str, status: SubscriptionStatus | None = None) -> Subscription:
    """
    Create a subscription for a user.
    Centralizes the business logic for creating subscriptions.

    Args:
        email: User's email
        plan_id: Optional plan ID (uses default if not provided)
        status: Optional status (uses TRIALING if not provided)

    Returns:
        Created subscription
    """
    plans_manager = await get_plans_manager()
    plan = plans_manager.plans.find_by_name(plan_name)
    if not plan:
        raise ValueError(f"Invalid plan name: {plan_name}")

    user = await User.find_by_email(email)
    if not user:
        raise ValueError(f"User with email {email} not found")

    subscription = Subscription(user=create_link_beanie_workaround(user), plan=plan)
    if status is not None:
        subscription.status = status

    await subscription.save()
    logger.info(f"Created {plan.name} subscription for user {user.email}")

    return subscription
