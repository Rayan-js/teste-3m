from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.domain.enums import TicketCategory, TicketPriority, TicketStatus
from app.domain.workflow import next_statuses


class SortField(StrEnum):
    CREATED_AT = "created_at"
    PRIORITY = "priority"


class SortOrder(StrEnum):
    ASC = "asc"
    DESC = "desc"


class TicketCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=10, max_length=5000)
    category: TicketCategory
    priority: TicketPriority


class StatusUpdate(BaseModel):
    status: TicketStatus


class TicketListQuery(BaseModel):
    status: TicketStatus | None = None
    category: TicketCategory | None = None
    priority: TicketPriority | None = None
    sort_by: SortField = SortField.CREATED_AT
    order: SortOrder = SortOrder.DESC
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class StatusChangeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    from_status: TicketStatus | None
    to_status: TicketStatus
    changed_at: datetime


class TicketSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    category: TicketCategory
    priority: TicketPriority
    status: TicketStatus
    created_at: datetime
    updated_at: datetime


class TicketDetail(TicketSummary):
    description: str
    history: list[StatusChangeRead]

    @computed_field
    @property
    def allowed_transitions(self) -> list[TicketStatus]:
        return next_statuses(self.status)


class TicketPage(BaseModel):
    items: list[TicketSummary]
    total: int
    page: int
    page_size: int


class ErrorResponse(BaseModel):
    detail: str
