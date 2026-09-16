import type {
  SortField,
  SortOrder,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "../types/ticket";

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  resolved: "Resolvido",
  closed: "Fechado",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  it: "TI",
  facilities: "Instalações",
  hr: "RH",
  finance: "Financeiro",
  other: "Outros",
};

// Button text for moving a ticket into each status.
export const TRANSITION_LABELS: Record<TicketStatus, string> = {
  open: "Reabrir",
  in_progress: "Iniciar atendimento",
  resolved: "Marcar como resolvido",
  closed: "Fechar ticket",
};

export const STATUSES = Object.keys(STATUS_LABELS) as TicketStatus[];
export const PRIORITIES = Object.keys(PRIORITY_LABELS) as TicketPriority[];
export const CATEGORIES = Object.keys(CATEGORY_LABELS) as TicketCategory[];

export const SORT_OPTIONS: readonly { sortBy: SortField; order: SortOrder; label: string }[] = [
  { sortBy: "created_at", order: "desc", label: "Mais recentes" },
  { sortBy: "created_at", order: "asc", label: "Mais antigos" },
  { sortBy: "priority", order: "desc", label: "Maior prioridade" },
  { sortBy: "priority", order: "asc", label: "Menor prioridade" },
];

export const PAGE_SIZE = 10;
