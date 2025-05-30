from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, HTTPException

from backend.api.routers.payments.models import Plan, Plans
from backend.services.payments.plans import get_plans_manager

if TYPE_CHECKING:
    from backend.services.payments.plans import PlansManager
router = APIRouter()


@router.get(
    "/plans",
    operation_id="payments_get_plans",
    summary="Get available subscription plans",
    description="Get available subscription plans",
)
async def get_plans(manager: "PlansManager" = Depends(get_plans_manager)) -> Plans:
    """
    Get available subscription plans from Polar
    """
    return manager.plans


@router.get(
    "/plans/refresh",
    operation_id="payments_get_plans_refresh",
    summary="Refresh available subscription plans",
    description="Refresh available subscription plans",
)
async def refresh_plans(
    force: bool = False,
    manager: "PlansManager" = Depends(get_plans_manager),
) -> Plans:
    await manager.refresh(force=force)
    return manager.plans


@router.get(
    "/plans/{plan_id}",
    operation_id="payments_get_plan",
    summary="Get details for a specific plan",
    description="Get details for a specific plan",
)
async def get_plan(plan_id: str, manager: "PlansManager" = Depends(get_plans_manager)) -> Plan:
    """
    Get details for a specific plan
    """
    plans = manager.plans
    plan = plans.get_plan_by_id(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan
