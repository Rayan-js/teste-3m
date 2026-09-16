import type {
  TicketCreatePayload,
  TicketDetail,
  TicketListParams,
  TicketPage,
  TicketStatus,
} from "../types/ticket";
import { request } from "./client";

export function listTickets(params: TicketListParams, signal?: AbortSignal) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  return request<TicketPage>(`/api/tickets?${query}`, { signal });
}

export function getTicket(id: number, signal?: AbortSignal) {
  return request<TicketDetail>(`/api/tickets/${id}`, { signal });
}

export function createTicket(payload: TicketCreatePayload) {
  return request<TicketDetail>("/api/tickets", { method: "POST", body: payload });
}

export function updateTicketStatus(id: number, status: TicketStatus) {
  return request<TicketDetail>(`/api/tickets/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}
