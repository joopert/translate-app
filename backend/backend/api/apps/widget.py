from collections.abc import Awaitable, Callable

import secure
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from backend.api.routers.widget import router as widget_router
from backend.core.settings import settings

secure_headers = secure.Secure.from_preset(
    preset=secure.Preset.BASIC
)  # setting it to strict or using .with_default_headers() gives errors on csp
# Can currently not override alone, we then need to do everything so we skip for now.

widget_api = FastAPI(root_path=settings.widget_root_path)

widget_api.add_middleware(GZipMiddleware, minimum_size=1500, compresslevel=5)
widget_api.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"]
)


@widget_api.middleware("http")
async def add_security_headers(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
    response = await call_next(request)
    await secure_headers.set_headers_async(response)  # type: ignore
    return response


widget_api.include_router(widget_router)
