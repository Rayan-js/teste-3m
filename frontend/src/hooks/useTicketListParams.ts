import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { CATEGORIES, PAGE_SIZE, PRIORITIES, STATUSES } from "../constants/tickets";
import type { SortField, SortOrder, TicketListParams } from "../types/ticket";

const SORT_FIELDS: readonly SortField[] = ["created_at", "priority"];
const SORT_ORDERS: readonly SortOrder[] = ["asc", "desc"];

export type ListParamChanges = Partial<Omit<TicketListParams, "page_size">>;

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.find((option) => option === value);
}

/** Filters and page live in the URL, so the view survives a reload and can be shared. */
export function useTicketListParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo<TicketListParams>(
    () => ({
      status: oneOf(searchParams.get("status"), STATUSES),
      category: oneOf(searchParams.get("category"), CATEGORIES),
      priority: oneOf(searchParams.get("priority"), PRIORITIES),
      sort_by: oneOf(searchParams.get("sort_by"), SORT_FIELDS) ?? "created_at",
      order: oneOf(searchParams.get("order"), SORT_ORDERS) ?? "desc",
      page: Math.max(1, Math.floor(Number(searchParams.get("page"))) || 1),
      page_size: PAGE_SIZE,
    }),
    [searchParams],
  );

  const updateParams = useCallback(
    (changes: ListParamChanges) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value === undefined) next.delete(key);
          else next.set(key, String(value));
        }
        // filter or sorting changed, go back to the first page
        if (!("page" in changes)) next.delete("page");
        return next;
      });
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(
    () => updateParams({ status: undefined, category: undefined, priority: undefined }),
    [updateParams],
  );

  const hasFilters = Boolean(params.status || params.category || params.priority);

  return { params, hasFilters, updateParams, clearFilters };
}
