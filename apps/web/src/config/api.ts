import type { ApiErrorBody, LoginResponse } from "@shared";

const ACCESS_KEY = "dhabar.access";
const REFRESH_KEY = "dhabar.refresh";
const apiOrigin = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

let accessToken = sessionStorage.getItem(ACCESS_KEY);

function endpoint(path: string): string {
  return `${apiOrigin}${path}`;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function setSession(access: string | null, refresh: string | null): void {
  accessToken = access;
  if (access) sessionStorage.setItem(ACCESS_KEY, access);
  else sessionStorage.removeItem(ACCESS_KEY);
  if (refresh) sessionStorage.setItem(REFRESH_KEY, refresh);
  else sessionStorage.removeItem(REFRESH_KEY);
}

export function hasRefreshToken(): boolean {
  return Boolean(sessionStorage.getItem(REFRESH_KEY));
}

async function refresh(): Promise<LoginResponse | null> {
  const refreshToken = sessionStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;
  const response = await fetch(endpoint("/api/v1/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    setSession(null, null);
    return null;
  }
  const data = (await response.json()) as LoginResponse;
  setSession(data.accessToken, data.refreshToken);
  return data;
}

let refreshPromise: Promise<LoginResponse | null> | null = null;

function refreshOnce(): Promise<LoginResponse | null> {
  if (!refreshPromise) {
    refreshPromise = refresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export function restoreSession(): Promise<LoginResponse | null> {
  return refreshOnce();
}

export async function api<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(endpoint(path), { ...options, headers });
  if (response.status === 401 && retry && !path.endsWith("/auth/login") && !path.endsWith("/auth/refresh")) {
    const refreshed = await refreshOnce();
    if (refreshed) return api<T>(path, options, false);
  }
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? (JSON.parse(text) as ApiErrorBody) : null;
  if (!response.ok) {
    throw new ApiError(response.status, data?.code ?? "REQUEST_FAILED", data?.message ?? "Request failed.");
  }
  return data as T;
}
