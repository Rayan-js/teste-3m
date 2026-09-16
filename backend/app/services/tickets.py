from sqlalchemy import asc, case, desc, func, select
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.orm.exc import StaleDataError

from app.domain.enums import PRIORITY_RANK, TicketStatus
from app.domain.exceptions import (
    ConcurrentUpdateError,
    InvalidStatusTransitionError,
    TicketNotFoundError,
)
from app.domain.workflow import can_transition
from app.models import StatusChange, Ticket
from app.models.types import utcnow
from app.schemas.ticket import SortField, SortOrder, TicketCreate, TicketListQuery

_priority_rank = case(
    *[(Ticket.priority == priority, rank) for priority, rank in PRIORITY_RANK.items()]
)


def create_ticket(db: Session, data: TicketCreate) -> Ticket:
    now = utcnow()
    ticket = Ticket(**data.model_dump(), status=TicketStatus.OPEN, created_at=now, updated_at=now)
    ticket.history.append(
        StatusChange(from_status=None, to_status=TicketStatus.OPEN, changed_at=now)
    )
    db.add(ticket)
    db.commit()
    return ticket


def list_tickets(db: Session, query: TicketListQuery) -> tuple[list[Ticket], int]:
    filters = []
    if query.status is not None:
        filters.append(Ticket.status == query.status)
    if query.category is not None:
        filters.append(Ticket.category == query.category)
    if query.priority is not None:
        filters.append(Ticket.priority == query.priority)

    total = db.scalar(select(func.count()).select_from(Ticket).where(*filters)) or 0

    direction = asc if query.order == SortOrder.ASC else desc
    if query.sort_by == SortField.PRIORITY:
        # na mesma prioridade, quem espera há mais tempo vem primeiro
        ordering = [direction(_priority_rank), Ticket.created_at.asc(), Ticket.id.asc()]
    else:
        ordering = [direction(Ticket.created_at), direction(Ticket.id)]

    stmt = (
        select(Ticket)
        .where(*filters)
        .order_by(*ordering)
        .offset((query.page - 1) * query.page_size)
        .limit(query.page_size)
    )
    return list(db.scalars(stmt)), total


def get_ticket(db: Session, ticket_id: int) -> Ticket:
    stmt = select(Ticket).where(Ticket.id == ticket_id).options(selectinload(Ticket.history))
    ticket = db.scalar(stmt)
    if ticket is None:
        raise TicketNotFoundError(ticket_id)
    return ticket


def change_status(db: Session, ticket_id: int, new_status: TicketStatus) -> Ticket:
    ticket = get_ticket(db, ticket_id)
    if not can_transition(ticket.status, new_status):
        raise InvalidStatusTransitionError(ticket.status, new_status)

    now = utcnow()
    ticket.history.append(
        StatusChange(from_status=ticket.status, to_status=new_status, changed_at=now)
    )
    ticket.status = new_status
    ticket.updated_at = now

    try:
        db.commit()
    except StaleDataError as exc:
        db.rollback()
        raise ConcurrentUpdateError(ticket_id) from exc
    return ticket
