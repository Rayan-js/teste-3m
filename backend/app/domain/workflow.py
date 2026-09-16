from app.domain.enums import TicketStatus

ALLOWED_TRANSITIONS: dict[TicketStatus, frozenset[TicketStatus]] = {
    TicketStatus.OPEN: frozenset({TicketStatus.IN_PROGRESS}),
    TicketStatus.IN_PROGRESS: frozenset({TicketStatus.RESOLVED}),
    TicketStatus.RESOLVED: frozenset({TicketStatus.CLOSED}),
    TicketStatus.CLOSED: frozenset(),
}


def can_transition(current: TicketStatus, target: TicketStatus) -> bool:
    return target in ALLOWED_TRANSITIONS[current]


def next_statuses(current: TicketStatus) -> list[TicketStatus]:
    return [status for status in TicketStatus if can_transition(current, status)]
