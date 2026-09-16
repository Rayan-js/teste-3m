export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketCategory = "it" | "facilities" | "hr" | "finance" | "other";

export type SortField = "created_at" | "priority";
export type SortOrder = "asc" | "desc";

export interface StatusChange {
  id: number;
  from_status: TicketStatus | null;
  to_status: TicketStatus;
  changed_at: string;
}

export interface TicketSummary {
  id: number;
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}

export interface TicketDetail extends TicketSummary {
  description: string;
  history: StatusChange[];
  allowed_transitions: TicketStatus[];
}

export interface TicketPage {
  items: TicketSummary[];
  total: number;
  page: number;
  page_size: number;
}

export interface TicketCreatePayload {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
}

export interface TicketListParams {
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  sort_by: SortField;
  order: SortOrder;
  page: number;
  page_size: number;
}
