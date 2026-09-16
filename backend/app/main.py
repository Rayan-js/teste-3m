from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.errors import register_exception_handlers
from app.routers import health, tickets


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    # sem migrations por enquanto
    Base.metadata.create_all(bind=engine)
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="Support Tickets API", version="1.0.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(app)

    app.include_router(health.router, prefix="/api")
    app.include_router(tickets.router, prefix="/api")
    return app


app = create_app()
