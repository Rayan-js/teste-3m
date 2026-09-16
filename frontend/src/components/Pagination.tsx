interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  return (
    <nav className="pagination" aria-label="Paginação">
      <span className="pagination__info">
        {total} {total === 1 ? "ticket" : "tickets"} · página {page} de {totalPages}
      </span>
      <div className="pagination__actions">
        <button
          type="button"
          className="button button--secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>
        <button
          type="button"
          className="button button--secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima
        </button>
      </div>
    </nav>
  );
}
