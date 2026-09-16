import {
  CATEGORIES,
  CATEGORY_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  SORT_OPTIONS,
  STATUSES,
  STATUS_LABELS,
} from "../constants/tickets";
import type { ListParamChanges } from "../hooks/useTicketListParams";
import type { TicketListParams } from "../types/ticket";

interface FilterSelectProps<T extends string> {
  label: string;
  allLabel: string;
  value: T | undefined;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T | undefined) => void;
}

function FilterSelect<T extends string>({
  label,
  allLabel,
  value,
  options,
  labels,
  onChange,
}: FilterSelectProps<T>) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(options.find((option) => option === event.target.value))}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option]}
          </option>
        ))}
      </select>
    </label>
  );
}

interface TicketFiltersProps {
  params: TicketListParams;
  hasFilters: boolean;
  onChange: (changes: ListParamChanges) => void;
  onClear: () => void;
}

const sortKey = (sortBy: string, order: string) => `${sortBy}:${order}`;

export function TicketFilters({ params, hasFilters, onChange, onClear }: TicketFiltersProps) {
  return (
    <div className="filters">
      <FilterSelect
        label="Status"
        allLabel="Todos"
        value={params.status}
        options={STATUSES}
        labels={STATUS_LABELS}
        onChange={(status) => onChange({ status })}
      />
      <FilterSelect
        label="Categoria"
        allLabel="Todas"
        value={params.category}
        options={CATEGORIES}
        labels={CATEGORY_LABELS}
        onChange={(category) => onChange({ category })}
      />
      <FilterSelect
        label="Prioridade"
        allLabel="Todas"
        value={params.priority}
        options={PRIORITIES}
        labels={PRIORITY_LABELS}
        onChange={(priority) => onChange({ priority })}
      />

      <label className="field">
        <span className="field__label">Ordenar por</span>
        <select
          value={sortKey(params.sort_by, params.order)}
          onChange={(event) => {
            const option = SORT_OPTIONS.find(
              ({ sortBy, order }) => sortKey(sortBy, order) === event.target.value,
            );
            if (option) onChange({ sort_by: option.sortBy, order: option.order });
          }}
        >
          {SORT_OPTIONS.map(({ sortBy, order, label }) => (
            <option key={sortKey(sortBy, order)} value={sortKey(sortBy, order)}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {hasFilters && (
        <button type="button" className="button button--link filters__clear" onClick={onClear}>
          Limpar filtros
        </button>
      )}
    </div>
  );
}
