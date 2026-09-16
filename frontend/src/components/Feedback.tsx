import type { ReactNode } from "react";

export function Loading({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="state state--error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="button button--secondary" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  children?: ReactNode;
}

export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="state">
      <p className="state__title">{title}</p>
      {children}
    </div>
  );
}
