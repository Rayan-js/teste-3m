from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.domain.exceptions import (
    ConcurrentUpdateError,
    DomainError,
    InvalidStatusTransitionError,
    TicketNotFoundError,
)

_STATUS_CODES: dict[type[DomainError], int] = {
    TicketNotFoundError: status.HTTP_404_NOT_FOUND,
    InvalidStatusTransitionError: status.HTTP_409_CONFLICT,
    ConcurrentUpdateError: status.HTTP_409_CONFLICT,
}


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def handle_domain_error(_request: Request, exc: DomainError) -> JSONResponse:
        status_code = _STATUS_CODES.get(type(exc), status.HTTP_400_BAD_REQUEST)
        return JSONResponse(status_code=status_code, content={"detail": str(exc)})
