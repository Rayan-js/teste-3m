import { useCallback, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { ApiError, getErrorMessage } from "../api/client";
import { getTicket, updateTicketStatus } from "../api/tickets";
import { PriorityBadge, StatusBadge } from "../components/Badges";
import { EmptyState, ErrorState, Loading } from "../components/Feedback";
import { StatusHistory } from "../components/StatusHistory";
import { CATEGORY_LABELS, PRIORITY_LABELS, TRANSITION_LABELS } from "../constants/tickets";
import { useAsync } from "../hooks/useAsync";
import type { TicketStatus } from "../types/ticket";
import { formatDateTime } from "../utils/format";

export function TicketDetailPage() {
  const { ticketId } = useParams();
  const id = Number(ticketId);
  const location = useLocation();
  const navigate = useNavigate();
  const justCreated = (location.state as { created?: boolean } | null)?.created === true;

  const loadTicket = useCallback(
    (signal: AbortSignal) =>
      Number.isInteger(id) && id > 0
        ? getTicket(id, signal)
        : Promise.reject(new ApiError("Ticket não encontrado.", 404)),
    [id],
  );
  const { data: ticket, error, reload, setData } = useAsync(loadTicket);

  const [pendingStatus, setPendingStatus] = useState<TicketStatus | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function goBack() {
    // "default" = opened directly, there is no history to go back to
    if (location.key === "default") navigate("/tickets");
    else navigate(-1);
  }

  async function handleTransition(target: TicketStatus) {
    if (!ticket) return;
    if (target === "closed" && !window.confirm("Fechar este ticket? Essa ação não pode ser desfeita.")) {
      return;
    }

    setPendingStatus(target);
    setActionError(null);
    try {
      setData(await updateTicketStatus(ticket.id, target));
    } catch (err) {
      setActionError(getErrorMessage(err));
      // 409: someone changed it first, reload to show the current state
      if (err instanceof ApiError && err.status === 409) reload();
    } finally {
      setPendingStatus(null);
    }
  }

  if (error) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <EmptyState title="Ticket não encontrado.">
          <Link to="/tickets" className="button button--secondary">
            Ver todos os tickets
          </Link>
        </EmptyState>
      );
    }
    return <ErrorState message={getErrorMessage(error)} onRetry={reload} />;
  }

  if (!ticket || ticket.id !== id) {
    return <Loading label="Carregando ticket..." />;
  }

  return (
    <article>
      <button type="button" className="button button--link back-link" onClick={goBack}>
        ← Voltar
      </button>

      {justCreated && (
        <div className="alert alert--success" role="status">
          Ticket criado com sucesso. A equipe de suporte já pode visualizá-lo.
        </div>
      )}

      <header className="ticket-header">
        <div>
          <p className="ticket-header__id">Ticket #{ticket.id}</p>
          <h1>{ticket.title}</h1>
        </div>
        <div className="ticket-header__badges">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </header>

      <div className="ticket-layout">
        <section className="card">
          <h2 className="card__title">Descrição</h2>
          <p className="ticket-description">{ticket.description}</p>

          <dl className="meta">
            <div>
              <dt>Categoria</dt>
              <dd>{CATEGORY_LABELS[ticket.category]}</dd>
            </div>
            <div>
              <dt>Prioridade</dt>
              <dd>{PRIORITY_LABELS[ticket.priority]}</dd>
            </div>
            <div>
              <dt>Aberto em</dt>
              <dd>{formatDateTime(ticket.created_at)}</dd>
            </div>
            <div>
              <dt>Última atualização</dt>
              <dd>{formatDateTime(ticket.updated_at)}</dd>
            </div>
          </dl>
        </section>

        <aside className="ticket-sidebar">
          <section className="card">
            <h2 className="card__title">Status</h2>
            {ticket.allowed_transitions.length === 0 ? (
              <p className="muted">Este ticket está fechado e não possui próximas etapas.</p>
            ) : (
              <div className="actions">
                {ticket.allowed_transitions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="button"
                    disabled={pendingStatus !== null}
                    onClick={() => handleTransition(status)}
                  >
                    {pendingStatus === status ? "Atualizando..." : TRANSITION_LABELS[status]}
                  </button>
                ))}
              </div>
            )}
            {actionError && (
              <p className="form-error" role="alert">
                {actionError}
              </p>
            )}
          </section>

          <section className="card">
            <h2 className="card__title">Histórico</h2>
            <StatusHistory history={ticket.history} />
          </section>
        </aside>
      </div>
    </article>
  );
}
