from app.domain.enums import TicketStatus


class DomainError(Exception):
    """Business rule violation."""


class TicketNotFoundError(DomainError):
    def __init__(self, ticket_id: int) -> None:
        super().__init__(f"Ticket {ticket_id} não encontrado.")
        self.ticket_id = ticket_id


class InvalidStatusTransitionError(DomainError):
    def __init__(self, current: TicketStatus, target: TicketStatus) -> None:
        super().__init__(f"Não é possível mudar o status de '{current}' para '{target}'.")
        self.current = current
        self.target = target


class ConcurrentUpdateError(DomainError):
    def __init__(self, ticket_id: int) -> None:
        super().__init__(
            f"O ticket {ticket_id} foi alterado por outra pessoa. Recarregue e tente novamente."
        )
        self.ticket_id = ticket_id
