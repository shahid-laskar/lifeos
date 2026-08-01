import { clearTokens, getAccessToken, getTokens, setTokens, type Tokens } from "./tokens";

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Attach the bearer token (default true). */
  auth?: boolean;
  signal?: AbortSignal;
};

let refreshPromise: Promise<Tokens | null> | null = null;

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function messageFromBody(body: unknown, fallback: string): string {
  if (typeof body === "string" && body.trim()) return body;
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const detail = record.detail ?? record.message ?? record.error;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const first = detail[0] as Record<string, unknown> | undefined;
      if (first && typeof first.msg === "string") return first.msg;
    }
  }
  return fallback;
}

async function refreshTokens(): Promise<Tokens | null> {
  const current = getTokens();
  if (!current?.refresh_token) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(buildUrl("/api/v1/auth/refresh"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: current.refresh_token }),
        });
        if (!response.ok) {
          clearTokens();
          return null;
        }
        const body = (await readBody(response)) as Partial<Tokens> | null;
        if (!body?.access_token) {
          clearTokens();
          return null;
        }
        const next: Tokens = {
          access_token: body.access_token,
          refresh_token: body.refresh_token ?? current.refresh_token,
        };
        setTokens(next);
        return next;
      } catch {
        clearTokens();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = true, signal } = options;

  const send = async (token: string | null) => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;

    return fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  };

  let response: Response;
  try {
    response = await send(auth ? getAccessToken() : null);
  } catch {
    throw new ApiError(0, "Couldn't reach the server — check your connection.");
  }

  if (response.status === 401 && auth) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      try {
        response = await send(refreshed.access_token);
      } catch {
        throw new ApiError(0, "Couldn't reach the server — check your connection.");
      }
    }
  }

  const payload = await readBody(response);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      messageFromBody(payload, "Something didn't work. Please try again."),
      payload,
    );
  }

  return payload as T;
}
