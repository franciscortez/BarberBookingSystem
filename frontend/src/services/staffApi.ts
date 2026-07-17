import { performTokenRefresh } from "./api";

const BASE = (
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? ""
).replace(/\/+$/, "");

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const responseCache = new Map<string, CacheEntry<unknown>>();
const pendingGets = new Map<string, Promise<unknown>>();

export function clearStaffCache(): void {
  responseCache.clear();
  pendingGets.clear();
}

export interface StaffRequestOptions extends RequestInit {
  cacheTtlMs?: number;
  staleWhileRevalidateMs?: number;
}

export async function staffRequest<T>(
  path: string,
  options: StaffRequestOptions = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();

  // Clear cache on write operations
  if (method !== "GET") {
    clearStaffCache();
  }

  const cacheTtlMs = options.cacheTtlMs ?? 30000; // 30 seconds default
  const staleWhileRevalidateMs = options.staleWhileRevalidateMs ?? 300000; // 5 minutes default
  const key = `${method}:${path}`;

  if (method === "GET" && cacheTtlMs > 0) {
    const cached = responseCache.get(key) as CacheEntry<T> | undefined;
    const now = Date.now();

    // Cache hit and still fresh
    if (cached && now - cached.timestamp < cacheTtlMs) {
      return cached.data;
    }

    // Cache hit but stale - return stale and update in background
    if (
      cached &&
      now - cached.timestamp < cacheTtlMs + staleWhileRevalidateMs
    ) {
      if (!pendingGets.has(key)) {
        void fetchAndCache<T>(path, options, key);
      }
      return cached.data;
    }

    // Cache miss but request is already in-flight
    const pending = pendingGets.get(key) as Promise<T> | undefined;
    if (pending) {
      return pending;
    }

    // Cache miss, trigger new request
    const promise = fetchAndCache<T>(path, options, key);
    pendingGets.set(key, promise);
    return promise;
  }

  return executeRequest<T>(path, options);
}

async function fetchAndCache<T>(
  path: string,
  options: StaffRequestOptions,
  key: string,
): Promise<T> {
  try {
    const data = await executeRequest<T>(path, options);
    responseCache.set(key, { data, timestamp: Date.now() });
    return data;
  } finally {
    pendingGets.delete(key);
  }
}

async function executeRequest<T>(
  path: string,
  options: RequestInit,
): Promise<T> {
  const token = localStorage.getItem("token");
  const authHeaders: Record<string, string> = {};
  if (token) {
    authHeaders["Authorization"] = `Bearer ${token}`;
  }

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...authHeaders,
    ...(options.headers as Record<string, string>),
  };

  let response = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: requestHeaders,
  });

  if (response.status === 401) {
    const newToken = await performTokenRefresh();
    if (newToken) {
      requestHeaders["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(`${BASE}${path}`, {
        ...options,
        credentials: "include",
        headers: requestHeaders,
      });
    }
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Request failed");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
