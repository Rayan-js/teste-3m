import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ApiError, getErrorMessage } from "../api/client";
import { createTicket } from "../api/tickets";
import { CATEGORIES, CATEGORY_LABELS, PRIORITIES, PRIORITY_LABELS } from "../constants/tickets";
import type { TicketCategory, TicketPriority } from "../types/ticket";

// must match the backend validation (app/schemas/ticket.py)
const TITLE_MIN = 3;
const TITLE_MAX = 120;
const DESCRIPTION_MIN = 10;
const DESCRIPTION_MAX = 5000;

interface FormValues {
  title: string;
  description: string;
  category: TicketCategory | "";
  priority: TicketPriority;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  title: "",
  description: "",
  category: "",
  priority: "medium",
};

const FIELD_ORDER: (keyof FormValues)[] = ["title", "category", "priority", "description"];

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const title = values.title.trim();
  const description = values.description.trim();

  if (title.length < TITLE_MIN) {
    errors.title = `Informe um título com pelo menos ${TITLE_MIN} caracteres.`;
  }
  if (!values.category) {
    errors.category = "Selecione uma categoria.";
  }
  if (description.length < DESCRIPTION_MIN) {
    errors.description = `Descreva a solicitação com pelo menos ${DESCRIPTION_MIN} caracteres.`;
  }
  return errors;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="field__error">
      {message}
    </p>
  ) : null;
}

export function NewTicketPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function showErrors(fieldErrors: FormErrors) {
    setErrors(fieldErrors);
    const firstInvalid = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (firstInvalid) document.getElementById(firstInvalid)?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0 || values.category === "") {
      showErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const ticket = await createTicket({
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        priority: values.priority,
      });
      // replace so "back" doesn't land on the filled form
      navigate(`/tickets/${ticket.id}`, { replace: true, state: { created: true } });
    } catch (error) {
      if (error instanceof ApiError) showErrors(error.fieldErrors);
      setSubmitError(getErrorMessage(error));
      setSubmitting(false);
    }
  }

  const describedBy = (field: keyof FormValues, extra?: string) =>
    [errors[field] ? `${field}-error` : null, extra].filter(Boolean).join(" ") || undefined;

  return (
    <section className="narrow">
      <div className="page-header">
        <div>
          <h1>Novo ticket</h1>
          <p className="page-header__subtitle">
            Descreva sua solicitação e a equipe de suporte vai dar andamento.
          </p>
        </div>
      </div>

      <form className="card form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="title" className="field__label">
            Título
          </label>
          <input
            id="title"
            type="text"
            value={values.title}
            maxLength={TITLE_MAX}
            placeholder="Ex.: Notebook não liga"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={describedBy("title")}
            onChange={(event) => updateField("title", event.target.value)}
          />
          <FieldError id="title-error" message={errors.title} />
        </div>

        <div className="form__row">
          <div className="field">
            <label htmlFor="category" className="field__label">
              Categoria
            </label>
            <select
              id="category"
              value={values.category}
              aria-invalid={Boolean(errors.category)}
              aria-describedby={describedBy("category")}
              onChange={(event) =>
                updateField(
                  "category",
                  CATEGORIES.find((category) => category === event.target.value) ?? "",
                )
              }
            >
              <option value="">Selecione...</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
            <FieldError id="category-error" message={errors.category} />
          </div>

          <div className="field">
            <label htmlFor="priority" className="field__label">
              Prioridade
            </label>
            <select
              id="priority"
              value={values.priority}
              aria-invalid={Boolean(errors.priority)}
              aria-describedby={describedBy("priority")}
              onChange={(event) =>
                updateField(
                  "priority",
                  PRIORITIES.find((priority) => priority === event.target.value) ?? "medium",
                )
              }
            >
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
            <FieldError id="priority-error" message={errors.priority} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="description" className="field__label">
            Descrição
          </label>
          <textarea
            id="description"
            value={values.description}
            maxLength={DESCRIPTION_MAX}
            rows={6}
            placeholder="O que aconteceu? Desde quando? Já tentou alguma solução?"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={describedBy("description", "description-counter")}
            onChange={(event) => updateField("description", event.target.value)}
          />
          <div className="field__footer">
            <FieldError id="description-error" message={errors.description} />
            <span id="description-counter" className="field__hint">
              {values.description.length}/{DESCRIPTION_MAX}
            </span>
          </div>
        </div>

        {submitError && (
          <div className="alert alert--error" role="alert">
            {submitError}
          </div>
        )}

        <div className="form__actions">
          <Link to="/tickets" className="button button--secondary">
            Cancelar
          </Link>
          <button type="submit" className="button" disabled={submitting}>
            {submitting ? "Enviando..." : "Criar ticket"}
          </button>
        </div>
      </form>
    </section>
  );
}
