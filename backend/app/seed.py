"""Cria tickets de exemplo.

    python -m app.seed
    python -m app.seed --reset
"""

import argparse
from datetime import timedelta

from sqlalchemy import func, select

from app.database import Base, SessionLocal, engine
from app.domain.enums import TicketCategory, TicketPriority, TicketStatus
from app.models import StatusChange, Ticket
from app.models.types import utcnow

WORKFLOW = [
    TicketStatus.OPEN,
    TicketStatus.IN_PROGRESS,
    TicketStatus.RESOLVED,
    TicketStatus.CLOSED,
]

# (título, descrição, categoria, prioridade, status atual, horas desde a criação)
SAMPLE_TICKETS = [
    (
        "Notebook não liga",
        "Meu notebook não liga desde hoje cedo. A luz de energia pisca e depois apaga.",
        TicketCategory.IT, TicketPriority.URGENT, TicketStatus.OPEN, 2,
    ),
    (
        "Ar-condicionado da sala 3 pingando",
        "Está caindo água do ar-condicionado em cima das mesas próximas à janela.",
        TicketCategory.FACILITIES, TicketPriority.HIGH, TicketStatus.IN_PROGRESS, 20,
    ),
    (
        "Acesso ao sistema financeiro",
        "Preciso de acesso de leitura ao sistema financeiro para fechar o relatório mensal.",
        TicketCategory.IT, TicketPriority.MEDIUM, TicketStatus.OPEN, 30,
    ),
    (
        "Dúvida sobre banco de horas",
        "Gostaria de entender como consultar meu saldo de banco de horas do último trimestre.",
        TicketCategory.HR, TicketPriority.LOW, TicketStatus.RESOLVED, 72,
    ),
    (
        "Reembolso de despesas de viagem",
        "Enviei as notas da viagem a São Paulo há duas semanas e o reembolso ainda não caiu.",
        TicketCategory.FINANCE, TicketPriority.MEDIUM, TicketStatus.IN_PROGRESS, 96,
    ),
    (
        "VPN desconectando",
        "A VPN cai a cada 10 minutos quando trabalho de casa, o que interrompe as chamadas.",
        TicketCategory.IT, TicketPriority.HIGH, TicketStatus.RESOLVED, 120,
    ),
    (
        "Lâmpada queimada no corredor",
        "Duas lâmpadas do corredor do 2º andar estão queimadas, perto do elevador.",
        TicketCategory.FACILITIES, TicketPriority.LOW, TicketStatus.CLOSED, 200,
    ),
    (
        "Atualização de dados bancários",
        "Troquei de banco e preciso atualizar a conta onde recebo o salário.",
        TicketCategory.HR, TicketPriority.HIGH, TicketStatus.OPEN, 5,
    ),
    (
        "Instalar pacote Office",
        "Recebi um computador novo e preciso do Office instalado para começar a trabalhar.",
        TicketCategory.IT, TicketPriority.MEDIUM, TicketStatus.CLOSED, 300,
    ),
    (
        "Cadeira quebrada",
        "O encosto da minha cadeira quebrou e não regula mais a altura.",
        TicketCategory.FACILITIES, TicketPriority.MEDIUM, TicketStatus.OPEN, 50,
    ),
    (
        "Crachá não abre a catraca",
        "Meu crachá parou de funcionar na catraca da entrada principal.",
        TicketCategory.OTHER, TicketPriority.URGENT, TicketStatus.IN_PROGRESS, 8,
    ),
    (
        "Informe de rendimentos",
        "Não encontrei meu informe de rendimentos no portal do colaborador.",
        TicketCategory.HR, TicketPriority.LOW, TicketStatus.OPEN, 150,
    ),
]


def build_ticket(
    title: str,
    description: str,
    category: TicketCategory,
    priority: TicketPriority,
    status: TicketStatus,
    hours_ago: int,
) -> Ticket:
    created_at = utcnow() - timedelta(hours=hours_ago)
    steps = WORKFLOW[: WORKFLOW.index(status) + 1]
    step_interval = timedelta(hours=hours_ago) / (len(steps) + 1)

    ticket = Ticket(
        title=title,
        description=description,
        category=category,
        priority=priority,
        status=status,
        created_at=created_at,
    )

    changed_at = created_at
    previous = None
    for step in steps:
        ticket.history.append(StatusChange(from_status=previous, to_status=step, changed_at=changed_at))
        ticket.updated_at = changed_at
        previous = step
        changed_at += step_interval

    return ticket


def main() -> None:
    parser = argparse.ArgumentParser(description="Popula o banco com tickets de exemplo.")
    parser.add_argument("--reset", action="store_true", help="apaga os dados existentes antes")
    args = parser.parse_args()

    if args.reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        if db.scalar(select(func.count()).select_from(Ticket)):
            print("O banco já possui tickets. Use --reset para recriar os dados de exemplo.")
            return

        db.add_all(build_ticket(*sample) for sample in SAMPLE_TICKETS)
        db.commit()
        print(f"{len(SAMPLE_TICKETS)} tickets de exemplo criados.")


if __name__ == "__main__":
    main()
