import { useCallback, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { getErrorMessage } from "../api/client";
import { listTickets } from "../api/tickets";
import { EmptyState, ErrorState, Loading } from "../components/Feedback";
import { Pagination } from "../components/Pagination";
import { TicketFilters } from "../components/TicketFilters";
import { TicketTable } from "../components/TicketTable";
import { useAsync } from "../hooks/useAsync";
import { useTicketListParams } from "../hooks/useTicketListParams";

export function TicketListPage() {
  const { params, hasFilters, updateParams, clearFilters } = useTicketListParams();
  const loadTickets = useCallback((signal: AbortSignal) => listTickets(params, signal), [params]);
  const { data, error, loading, reload } = useAsync(loadTickets);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;
  // URL pointing to a page that no longer exists
  const pageOutOfRange = data !== null && data.items.length === 0 && data.total > 0;

  useEffect(() => {
    if (pageOutOfRange) updateParams({ page: totalPages });
  }, [pageOutOfRange, totalPages, updateParams]);

  let content: ReactNode;
  if (error) {
    content = <ErrorState message={getErrorMessage(error)} onRetry={reload} />;
  } else if (!data || pageOutOfRange) {
    content = <Loading label="Carregando tickets..." />;
  } else if (data.items.length === 0) {
    content = hasFilters ? (
      <EmptyState title="Nenhum ticket encontrado com esses filtros.">
        <button type="button" className="button button--secondary" onClick={clearFilters}>
          Limpar filtros
        </button>
      </EmptyState>
    ) : (
      <EmptyState title="Nenhum ticket foi aberto ainda.">
        <Link to="/tickets/new" className="button">
          Abrir o primeiro ticket
        </Link>
      </EmptyState>
    );
  } else {
    content = (
      <div className={loading ? "is-refreshing" : undefined} aria-busy={loading}>
        <TicketTable tickets={data.items} />
        <Pagination
          page={data.page}
          totalPages={totalPages}
          total={data.total}
          onPageChange={(page) => updateParams({ page })}
        />
      </div>
    );
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Tickets</h1>
          <p className="page-header__subtitle">Acompanhe e gerencie as solicitações de suporte.</p>
        </div>
        <Link to="/tickets/new" className="button">
          Novo ticket
        </Link>
      </div>

      <TicketFilters
        params={params}
        hasFilters={hasFilters}
        onChange={updateParams}
        onClear={clearFilters}
      />

      {content}
    </section>
  );
}
