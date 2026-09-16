import { PRIORITY_LABELS, STATUS_LABELS } from "../constants/tickets";
import type { TicketPriority, TicketStatus } from "../types/ticket";

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={`badge badge--status-${status}`}>{STATUS_LABELS[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <span className={`badge badge--priority-${priority}`}>{PRIORITY_LABELS[priority]}</span>;
}
