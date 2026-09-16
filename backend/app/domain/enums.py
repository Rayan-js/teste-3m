from enum import StrEnum


class TicketStatus(StrEnum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TicketCategory(StrEnum):
    IT = "it"
    FACILITIES = "facilities"
    HR = "hr"
    FINANCE = "finance"
    OTHER = "other"


# ordenar a coluna direto daria ordem alfabética, por isso o peso numérico
PRIORITY_RANK: dict[TicketPriority, int] = {
    TicketPriority.LOW: 1,
    TicketPriority.MEDIUM: 2,
    TicketPriority.HIGH: 3,
    TicketPriority.URGENT: 4,
}
