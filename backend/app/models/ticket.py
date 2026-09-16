from datetime import datetime

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.domain.enums import TicketCategory, TicketPriority, TicketStatus
from app.models.types import UTCDateTime, enum_column, utcnow


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[TicketCategory] = mapped_column(enum_column(TicketCategory), index=True)
    priority: Mapped[TicketPriority] = mapped_column(enum_column(TicketPriority), index=True)
    status: Mapped[TicketStatus] = mapped_column(
        enum_column(TicketStatus), default=TicketStatus.OPEN, index=True
    )
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    # optimistic lock: on two concurrent changes, the second one fails
    version: Mapped[int] = mapped_column()

    history: Mapped[list["StatusChange"]] = relationship(
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="StatusChange.id",
    )

    __mapper_args__ = {"version_id_col": version}


class StatusChange(Base):
    __tablename__ = "status_changes"

    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey("tickets.id", ondelete="CASCADE"), index=True)
    from_status: Mapped[TicketStatus | None] = mapped_column(enum_column(TicketStatus))
    to_status: Mapped[TicketStatus] = mapped_column(enum_column(TicketStatus))
    changed_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)

    ticket: Mapped[Ticket] = relationship(back_populates="history")
