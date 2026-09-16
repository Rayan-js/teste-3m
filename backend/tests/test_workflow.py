import pytest

from app.domain.enums import TicketStatus
from app.domain.workflow import can_transition, next_statuses

VALID_TRANSITIONS = {
    (TicketStatus.OPEN, TicketStatus.IN_PROGRESS),
    (TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED),
    (TicketStatus.RESOLVED, TicketStatus.CLOSED),
}


@pytest.mark.parametrize("current", list(TicketStatus))
@pytest.mark.parametrize("target", list(TicketStatus))
def test_only_the_next_step_of_the_workflow_is_allowed(current, target):
    assert can_transition(current, target) == ((current, target) in VALID_TRANSITIONS)


def test_next_statuses_follow_the_workflow():
    assert next_statuses(TicketStatus.OPEN) == [TicketStatus.IN_PROGRESS]
    assert next_statuses(TicketStatus.IN_PROGRESS) == [TicketStatus.RESOLVED]
    assert next_statuses(TicketStatus.RESOLVED) == [TicketStatus.CLOSED]


def test_closed_is_a_final_status():
    assert next_statuses(TicketStatus.CLOSED) == []
