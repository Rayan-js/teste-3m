import type { StatusChange } from "../types/ticket";
import { formatDateTime } from "../utils/format";
import { StatusBadge } from "./Badges";

export function StatusHistory({ history }: { history: StatusChange[] }) {
  return (
    <ol className="timeline">
      {history.map((change) => (
        <li key={change.id} className="timeline__item">
          <span className="timeline__dot" aria-hidden="true" />
          <div className="timeline__text">
            {change.from_status === null ? (
              <>
                Ticket aberto como <StatusBadge status={change.to_status} />
              </>
            ) : (
              <>
                <StatusBadge status={change.from_status} />
                <span aria-label="para">→</span>
                <StatusBadge status={change.to_status} />
              </>
            )}
          </div>
          <time className="timeline__date" dateTime={change.changed_at}>
            {formatDateTime(change.changed_at)}
          </time>
        </li>
      ))}
    </ol>
  );
}
