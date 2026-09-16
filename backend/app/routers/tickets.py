from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Request, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.ticket import (
    ErrorResponse,
    StatusUpdate,
    TicketCreate,
    TicketDetail,
    TicketListQuery,
    TicketPage,
    TicketSummary,
)
from app.services import tickets as ticket_service

router = APIRouter(prefix="/tickets", tags=["tickets"])

DbSession = Annotated[Session, Depends(get_db)]
TicketId = Annotated[int, Path(ge=1)]

NOT_FOUND_RESPONSE = {404: {"model": ErrorResponse, "description": "Ticket não encontrado"}}
CONFLICT_RESPONSE = {409: {"model": ErrorResponse, "description": "Transição de status não permitida"}}


@router.get("", response_model=TicketPage)
def list_tickets(db: DbSession, query: Annotated[TicketListQuery, Query()]) -> TicketPage:
    tickets, total = ticket_service.list_tickets(db, query)
    return TicketPage(
        items=[TicketSummary.model_validate(ticket) for ticket in tickets],
        total=total,
        page=query.page,
        page_size=query.page_size,
    )


@router.post("", response_model=TicketDetail, status_code=status.HTTP_201_CREATED)
def create_ticket(
    payload: TicketCreate, request: Request, response: Response, db: DbSession
) -> TicketDetail:
    ticket = ticket_service.create_ticket(db, payload)
    response.headers["Location"] = str(request.url_for("get_ticket", ticket_id=ticket.id))
    return TicketDetail.model_validate(ticket)


@router.get("/{ticket_id}", response_model=TicketDetail, responses=NOT_FOUND_RESPONSE)
def get_ticket(ticket_id: TicketId, db: DbSession) -> TicketDetail:
    return TicketDetail.model_validate(ticket_service.get_ticket(db, ticket_id))


@router.patch(
    "/{ticket_id}/status",
    response_model=TicketDetail,
    responses={**NOT_FOUND_RESPONSE, **CONFLICT_RESPONSE},
)
def update_ticket_status(ticket_id: TicketId, payload: StatusUpdate, db: DbSession) -> TicketDetail:
    ticket = ticket_service.change_status(db, ticket_id, payload.status)
    return TicketDetail.model_validate(ticket)
