import { Link, useNavigate } from "react-router-dom";

import { CATEGORY_LABELS } from "../constants/tickets";
import type { TicketSummary } from "../types/ticket";
import { formatDateTime } from "../utils/format";
import { PriorityBadge, StatusBadge } from "./Badges";

export function TicketTable({ tickets }: { tickets: TicketSummary[] }) {
  const navigate = useNavigate();

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Título</th>
            <th scope="col">Categoria</th>
            <th scope="col">Prioridade</th>
            <th scope="col">Status</th>
            <th scope="col">Aberto em</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="table__row--clickable"
              onClick={() => navigate(`/tickets/${ticket.id}`)}
            >
              <td className="table__id">{ticket.id}</td>
              <td>
                <Link
                  to={`/tickets/${ticket.id}`}
                  className="table__title"
                  onClick={(event) => event.stopPropagation()}
                >
                  {ticket.title}
                </Link>
              </td>
              <td>{CATEGORY_LABELS[ticket.category]}</td>
              <td>
                <PriorityBadge priority={ticket.priority} />
              </td>
              <td>
                <StatusBadge status={ticket.status} />
              </td>
              <td className="table__date">
                <time dateTime={ticket.created_at}>{formatDateTime(ticket.created_at)}</time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
