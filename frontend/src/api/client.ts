const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  signal?: AbortSignal;
}

interface ValidationIssue {
  loc: (string | number)[];
  msg: string;
}

function toApiError(status: number, body: unknown): ApiError {
  const detail = (body as { detail?: unknown } | null)?.detail;

  // erro de negócio vem como string, erro de validação vem como lista de campos
  if (typeof detail === "string") {
    return new ApiError(detail, status);
  }
  if (Array.isArray(detail)) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of detail as ValidationIssue[]) {
      const field = issue.loc.at(-1);
      if (typeof field === "string") fieldErrors[field] = issue.msg;
    }
    return new ApiError("Alguns campos estão inválidos.", status, fieldErrors);
  }
  return new ApiError("Erro inesperado no servidor. Tente novamente.", status);
}

export async function request<T>(
  path: string,
  { method = "GET", body, signal }: RequestOptions = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError("Não foi possível conectar ao servidor.", 0);
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw toApiError(response.status, data);
  }
  return data as T;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Algo deu errado. Tente novamente.";
}
