import asyncio
from datetime import datetime, timedelta
from typing import TYPE_CHECKING, Any, cast

from polar_sdk import Polar

from backend.api.routers.payments.models import Plan, Plans
from backend.utils.log import logger

if TYPE_CHECKING:
    from backend.api.routers.payments.models import PaymentProvider


class PlansManager:
    """Manager for subscription plans with Singleton pattern"""

    __instance = None

    def __new__(cls, *args: Any, **kwargs: Any) -> "PlansManager":
        """Control instance creation to ensure singleton pattern"""
        if cls.__instance is None:
            cls.__instance = super().__new__(cls)
            cls.__instance._initialized = False
        return cls.__instance

    def __init__(self, settings: "PaymentProvider"):
        """Initialize the instance only once"""
        if not getattr(self, "_initialized", False):
            self._plans: Plans | None = None
            self._last_refresh_time: datetime | None = None
            self._refresh_lock = asyncio.Lock()
            self._settings = settings
            self._initialized = True
            self._client = Polar(access_token=settings.api_key.get_secret_value(), server=settings.environment)
            self._refresh_interval_hours = self._settings.plans_refresh_interval_hours
            self._auto_refresh_task: asyncio.Task[None] | None = None

    async def get_plans(self) -> Plans:
        """Get cached plans, refreshing if needed"""
        if self._plans is None:
            await self.refresh(force=True)

        return cast(Plans, self._plans)  # Plans should be initialized at this point

    @property
    def plans(self) -> Plans:
        """Get cached plans, refreshing if needed"""
        if self._plans is None:
            raise ValueError("Plans not initialized - call get_plans() first")
        return self._plans

    @plans.setter
    def plans(self, value: Plans) -> None:
        """Set plans and update refresh time

        This is primarily intended for development and testing purposes.
        """
        self._plans = value
        self._last_refresh_time = datetime.now()

    async def refresh(self, force: bool = False) -> None:
        """Refresh plans from the Paddle API

        Args:
            force: Force refresh even if cache is recent
        """
        if (
            not force
            and self._last_refresh_time
            and (datetime.now() - self._last_refresh_time < timedelta(hours=self._refresh_interval_hours))
        ):
            return

        async with self._refresh_lock:
            # Double-check after acquiring lock
            if (
                not force
                and self._last_refresh_time
                and (datetime.now() - self._last_refresh_time < timedelta(hours=self._refresh_interval_hours))
            ):
                return

            logger.info("Refreshing plans from Polar API.")
            self._plans = await self._fetch_plans_from_api()
            self._last_refresh_time = datetime.now()

    async def _fetch_plans_from_api(self) -> Plans:
        """Fetch plans from Polar API"""
        logger.info("Fetching plans from Polar API.")
        products = await self._client.products.list_async()
        if products is None:
            return Plans(items=[])

        plans: list[Plan] = []
        for product in products.result.items:
            plans.append(Plan(id=product.id, name=product.name, description=product.description))
        return Plans(items=plans)

    async def start_auto_refresh(self) -> None:
        """Start the automatic refresh process"""
        if self._auto_refresh_task is None:
            logger.info("Starting automatic refresh of plans.")
            self._auto_refresh_task = asyncio.create_task(self._auto_refresh_loop())

    async def _auto_refresh_loop(self) -> None:
        """Loop to refresh plans at regular intervals"""
        while True:
            next_refresh = datetime.now() + timedelta(hours=self._refresh_interval_hours)
            await self.refresh()
            sleep_seconds = (next_refresh - datetime.now()).total_seconds()
            if sleep_seconds > 0:
                await asyncio.sleep(sleep_seconds)


async def get_plans_manager() -> PlansManager:
    """
    Returns a singleton instance of PlansManager.

    If the environment is local, it also loads mock plans data from a JSON file.
    """
    from backend.core.settings import settings

    plans_manager = PlansManager(settings.payments)

    if settings.use_mock_data:
        import json

        mock_plans_data = json.loads(settings.mock_data.get_provider_plans("polar").absolute().read_text())
        await plans_manager.get_plans()
        plans_manager.plans = Plans(**mock_plans_data)
    else:
        await plans_manager.get_plans()
        await plans_manager.start_auto_refresh()

    return plans_manager
