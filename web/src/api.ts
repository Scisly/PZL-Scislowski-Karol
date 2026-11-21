type Problem = {
  title?: string;
  detail?: string;
  errorCode?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
};
const defaults: Record<number, string> = {
  400: "Sprawdź poprawność danych.",
  401: "Sesja wygasła. Zaloguj się ponownie, aby zapisać zmiany.",
  403: "Nie masz uprawnień do tej operacji.",
  404: "Nie znaleziono zasobu lub nie masz do niego dostępu.",
  409: "Zmiana jest sprzeczna z aktualnym stanem danych.",
  500: "Nie udało się wykonać operacji. Spróbuj ponownie.",
  503: "Usługa jest chwilowo niedostępna.",
  504: "Upłynął czas oczekiwania na usługę.",
};
export class ApiError extends Error {
  status: number;
  fields: Record<string, string>;
  traceId?: string;
  constructor(status: number, problem: Problem = {}) {
    super(
      problem.detail ||
        defaults[status] ||
        problem.title ||
        "Nie udało się połączyć z serwerem. Sprawdź połączenie i spróbuj ponownie.",
    );
    this.status = status;
    this.traceId = problem.traceId;
    this.fields = Object.fromEntries(
      Object.entries(problem.errors ?? {}).map(([key, value]) => [
        key.charAt(0).toLowerCase() + key.slice(1),
        value.join(" "),
      ]),
    );
  }
}
let csrf: string | undefined;
let csrfPending: Promise<string> | undefined;
export function resetCsrf() {
  csrf = undefined;
  csrfPending = undefined;
}
export async function refreshCsrf() {
  resetCsrf();
  return getCsrf();
}
async function getCsrf(): Promise<string> {
  if (csrf) return csrf;
  if (!csrfPending)
    csrfPending = fetch("/api/auth/csrf", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new ApiError(response.status);
        const body = (await response.json()) as { token: string };
        csrf = body.token;
        return body.token;
      })
      .finally(() => {
        csrfPending = undefined;
      });
  return csrfPending;
}
export async function api<T = void>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const mutating =
    options.method &&
    !["GET", "HEAD", "OPTIONS"].includes(options.method.toUpperCase());
  if (mutating) headers.set("X-CSRF-TOKEN", await getCsrf());
  if (options.body) headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiError(0);
  }
  if (!response.ok) {
    let problem: Problem = {};
    try {
      problem = (await response.json()) as Problem;
    } catch {
      /* Empty proxy/server errors use safe client copy. */
    }
    if (response.status === 401 && !path.startsWith("/auth/")) {
      resetCsrf();
      window.dispatchEvent(new Event("session-expired"));
    }
    throw new ApiError(response.status, problem);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export const body = (value: unknown) => JSON.stringify(value);
