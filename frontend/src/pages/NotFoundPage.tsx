import { Link } from "react-router-dom";

import { EmptyState } from "../components/Feedback";

export function NotFoundPage() {
  return (
    <EmptyState title="Página não encontrada.">
      <Link to="/tickets" className="button button--secondary">
        Ir para os tickets
      </Link>
    </EmptyState>
  );
}
