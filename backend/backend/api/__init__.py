from collections.abc import Awaitable, Callable
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi_pagination import add_pagination
from secure import Secure

from backend.api.exceptions import Detail
from backend.api.routers.auth import router as auth_router
from backend.api.routers.payments import router as payments_router
from backend.core.db import init_db
from backend.core.settings import settings

app = FastAPI()
secure_headers = Secure.with_default_headers()


# TODO: not sure about below function
@app.middleware("http")
async def add_security_headers(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
    response = await call_next(request)
    await secure_headers.set_headers_async(response)  # type: ignore
    return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield await init_db()


app = FastAPI(lifespan=lifespan, root_path=settings.api_root_path)
app.add_middleware(GZipMiddleware, minimum_size=1500, compresslevel=5)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)
app.include_router(auth_router)
app.include_router(payments_router)
add_pagination(app)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details: list[Detail] = []

    for error in exc.errors():
        detail = Detail(
            loc=error["loc"],
            msg=error["msg"],
            code="VALIDATION_ERROR",
        )
        # TODO: check if we can do it without model_dump
        details.append(detail.model_dump())  # type: ignore
    return JSONResponse(status_code=422, content=details)
