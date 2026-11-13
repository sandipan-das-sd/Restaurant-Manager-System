import Constants from "expo-constants";
import type { ApiErrorBody, LoginResponse } from "@shared";
import { readSession, writeSession, type StoredSession } from "./session";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const PRODUCTION_API_URL = "https://test.sandipandas.website";

function apiBase(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (__DEV__) {
    const hostUri =
      Constants.expoConfig?.hostUri ??
      (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;
    const host = hostUri?.split(":")[0];
    if (host) return `http://${host}:4000`;
    return "http://127.0.0.1:4000";
  }
  return PRODUCTION_API_URL;
}

let memory: StoredSession | null = null;

async function currentSession(): Promise<StoredSession | null> {
  if (memory) return memory;
  memory = await readSession();
  return memory;
}

async function saveSession(session: StoredSession | null): Promise<void> {
  memory = session;
  await writeSession(session);
}

async function refresh(): Promise<LoginResponse | null> {
  const session = await currentSession();
  if (!session) return null;
  const response = await fetch(`${apiBase()}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
  if (!response.ok) {
    await saveSession(null);
    return null;
  }
  const data = (await response.json()) as LoginResponse;
  await saveSession({ accessToken: data.accessToken, refreshToken: data.refreshToken });
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
  const session = await currentSession();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (session?.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);

  const response = await fetch(`${apiBase()}${path}`, { ...options, headers });
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

export async function signInRequest(email: string, password: string): Promise<LoginResponse> {
  const session = await api<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  await saveSession({ accessToken: session.accessToken, refreshToken: session.refreshToken });
  return session;
}

export async function signOutRequest(): Promise<void> {
  const session = await currentSession();
  try {
    await api(
      "/api/v1/auth/logout",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken: session?.refreshToken }),
      },
      false,
    );
  } catch {
    // Local sign-out still stands if the network call fails.
  }
  await saveSession(null);
}
