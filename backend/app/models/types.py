from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum
from sqlalchemy.types import TypeDecorator


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UTCDateTime(TypeDecorator[datetime]):
    """Grava em UTC e devolve com timezone (o SQLite não guarda fuso)."""

    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError("Naive datetimes are not allowed; use timezone-aware values.")
        return value.astimezone(timezone.utc).replace(tzinfo=None)

    def process_result_value(self, value: datetime | None, dialect) -> datetime | None:
        if value is None:
            return None
        return value.replace(tzinfo=timezone.utc)


def enum_column(enum_cls: type[PyEnum]) -> Enum:
    """Guarda o valor do enum como texto em vez de um enum nativo do banco."""
    return Enum(
        enum_cls,
        native_enum=False,
        length=20,
        values_callable=lambda members: [member.value for member in members],
        validate_strings=True,
    )
