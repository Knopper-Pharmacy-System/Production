import { API_BASE_URL } from "./baseUrl";

function formatErrorMessage(message: string, status?: number): string {
  return status ? `${message} (HTTP ${status})` : message;
}

async function parseResponseJsonSafe(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export type FetchJsonOptions = {
  path: string; // can be absolute (starts with http) or relative to API_BASE_URL
  method?: string;
  body?: unknown;
  token?: string;
  query?: Record<string, string | number | boolean | undefined>;
  contentType?: string;
};

export async function fetchJson<T>({
  path,
  method = "GET",
  body,
  token,
  query,
  contentType = "application/json",
}: FetchJsonOptions): Promise<T> {
  const url = new URL(path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`);

  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (contentType && body !== undefined) headers["Content-Type"] = contentType;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const data = await parseResponseJsonSafe(res);
    const message =
      (data && typeof data === "object" && "message" in data && (data as any).message) ||
      (data && typeof data === "object" && "error" in data && (data as any).error) ||
      `Request failed`;

    throw new Error(formatErrorMessage(String(message), res.status));
  }

  return (await res.json()) as T;
}

export function getTokenOrThrow(token?: string): string {
  const t = token ?? localStorage.getItem("access_token") ?? "";
  if (!t) throw new Error("No authentication token found");
  return t;
}

export function normalizePeriod(period: string | undefined): "week" | "month" | "year" {
  const p = (period ?? "week").toLowerCase();
  if (p === "week" || p === "month" || p === "year") return p;
  return "week";
}

export function toSafePrimitiveString(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (v === null) return "";
  return typeof v === "undefined" ? "" : String(v);
}

export const API = {
  getToken: () => getTokenOrThrow(),
  baseUrl: API_BASE_URL,
};

