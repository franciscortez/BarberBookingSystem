import type { Barber, Service, Appointment } from "../types";

const rawApiBaseUrl = (
  import.meta.env.VITE_API_URL as string | undefined
)?.trim();
const API_BASE_URL = rawApiBaseUrl ? rawApiBaseUrl.replace(/\/+$/, "") : "";
const CATALOG_TTL_MS = 60_000;
const CATALOG_STALE_MS = 300_000;

type RequestOptions = RequestInit & {
  cacheKey?: string;
  cacheTtlMs?: number;
  staleWhileRevalidateMs?: number;
};

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const responseCache = new Map<string, CacheEntry<unknown>>();
const pendingGets = new Map<string, Promise<unknown>>();

const createAbortError = () =>
  new DOMException("The operation was aborted.", "AbortError");

const withoutSignal = (options: RequestInit): RequestInit => {
  const optionsWithoutSignal = { ...options };
  delete optionsWithoutSignal.signal;
  return optionsWithoutSignal;
};

const withAbortSignal = <T>(
  promise: Promise<T>,
  signal?: AbortSignal,
): Promise<T> => {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(createAbortError());

  return new Promise<T>((resolve, reject) => {
    const handleAbort = () => reject(createAbortError());
    signal.addEventListener("abort", handleAbort, { once: true });

    promise.then(
      (data) => {
        signal.removeEventListener("abort", handleAbort);
        resolve(data);
      },
      (error) => {
        signal.removeEventListener("abort", handleAbort);
        reject(error);
      },
    );
  });
};

const buildUrl = (path: string): string => {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_URL is not configured");
  }
  return `${API_BASE_URL}${path}`;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.details || errorMessage;
    } catch {
      // Ignore JSON parse failure for non-JSON errors
    }
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { cacheKey, cacheTtlMs, staleWhileRevalidateMs, ...fetchOptions } =
    options;
  const method = (fetchOptions.method ?? "GET").toString().toUpperCase();
  const url = buildUrl(path);
  const key = cacheKey ?? `${method}:${url}`;
  const isCacheableGet = method === "GET" && cacheTtlMs !== undefined;

  const token = localStorage.getItem("token");
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  if (method === "GET") {
    const cached = responseCache.get(key) as CacheEntry<T> | undefined;
    const now = Date.now();

    if (
      cached &&
      cacheTtlMs !== undefined &&
      now - cached.timestamp < cacheTtlMs
    ) {
      return cached.data;
    }

    if (
      cached &&
      cacheTtlMs !== undefined &&
      staleWhileRevalidateMs !== undefined &&
      now - cached.timestamp < cacheTtlMs + staleWhileRevalidateMs
    ) {
      if (!pendingGets.has(key)) {
        void request<T>(path, {
          ...withoutSignal(fetchOptions),
          cacheKey: key,
          cacheTtlMs,
        });
      }
      return cached.data;
    }

    const pending = isCacheableGet
      ? (pendingGets.get(key) as Promise<T> | undefined)
      : undefined;
    if (pending)
      return withAbortSignal(pending, fetchOptions.signal ?? undefined);

    const requestOptions = {
      credentials: "include" as const,
      headers: {
        "ngrok-skip-browser-warning": "true",
        ...authHeaders,
        ...((fetchOptions.headers as Record<string, string>) || {}),
      },
      ...(isCacheableGet ? withoutSignal(fetchOptions) : fetchOptions),
    };
    const promise = fetch(url, requestOptions)
      .then((response) => handleResponse<T>(response))
      .then((data) => {
        if (cacheTtlMs !== undefined) {
          responseCache.set(key, { data, timestamp: Date.now() });
        }
        return data;
      })
      .finally(() => {
        pendingGets.delete(key);
      });

    if (isCacheableGet) {
      pendingGets.set(key, promise);
      return withAbortSignal(promise, fetchOptions.signal ?? undefined);
    }
    return promise;
  }

  return fetch(url, {
    credentials: "include",
    headers: {
      "ngrok-skip-browser-warning": "true",
      ...authHeaders,
      ...((fetchOptions.headers as Record<string, string>) || {}),
    },
    ...fetchOptions,
  }).then((response) => handleResponse<T>(response));
}

export interface CatalogResponse {
  barbers: Barber[];
  services: Service[];
}

export async function getCatalog(
  options: { signal?: AbortSignal } = {},
): Promise<CatalogResponse> {
  return request<CatalogResponse>("/api/catalog", {
    signal: options.signal,
    cacheKey: "catalog",
    cacheTtlMs: CATALOG_TTL_MS,
    staleWhileRevalidateMs: CATALOG_STALE_MS,
  });
}

/**
 * Barbers API
 */
export async function getBarbers(
  options: { signal?: AbortSignal } = {},
): Promise<Barber[]> {
  const catalog = await getCatalog(options);
  return catalog.barbers;
}

export async function getBarber(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<Barber> {
  return request<Barber>(`/api/barbers/${encodeURIComponent(id)}`, {
    signal: options.signal,
  });
}

/**
 * Services API
 */
export async function getServices(
  barberId?: string,
  options: { signal?: AbortSignal } = {},
): Promise<Service[]> {
  if (!barberId) {
    const catalog = await getCatalog(options);
    return catalog.services;
  }

  return request<Service[]>(
    `/api/services?barberId=${encodeURIComponent(barberId)}`,
    {
      signal: options.signal,
      cacheKey: `services:${barberId}`,
      cacheTtlMs: CATALOG_TTL_MS,
      staleWhileRevalidateMs: CATALOG_STALE_MS,
    },
  );
}

export async function getService(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<Service> {
  return request<Service>(`/api/services/${encodeURIComponent(id)}`, {
    signal: options.signal,
  });
}

/**
 * Availability API
 */
export interface AvailabilityResponse {
  barberId: string;
  date: string;
  serviceId?: string;
  duration: number;
  slots?: {
    start: string;
    end: string;
    available: boolean;
    unavailableReason?: "booked" | "past";
  }[];
  availableSlots: { start: string; end: string }[];
}

export async function getAvailability(
  barberId: string,
  date: string,
  serviceId?: string,
  options: { signal?: AbortSignal } = {},
): Promise<AvailabilityResponse> {
  let path = `/api/availability?barberId=${encodeURIComponent(barberId)}&date=${encodeURIComponent(date)}`;
  if (serviceId) {
    path += `&serviceId=${encodeURIComponent(serviceId)}`;
  }
  return request<AvailabilityResponse>(path, { signal: options.signal });
}

/**
 * Appointments API
 */
export interface CreateBookingInput {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  barber_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
}

export interface CreateBookingResponse {
  message: string;
  appointment: Appointment;
  checkout_url: string;
}

export async function createBooking(
  data: CreateBookingInput,
): Promise<CreateBookingResponse> {
  return request<CreateBookingResponse>("/api/appointments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function getManagedBooking(
  token: string,
  options: { signal?: AbortSignal } = {},
): Promise<Appointment> {
  return request<Appointment>(
    `/api/appointments/manage?token=${encodeURIComponent(token)}`,
    {
      signal: options.signal,
    },
  );
}

export interface RescheduleBookingInput {
  token: string;
  appointment_date: string;
  start_time: string;
}

export interface RescheduleBookingResponse {
  message: string;
  appointment: Appointment;
}

export async function rescheduleBooking(
  data: RescheduleBookingInput,
): Promise<RescheduleBookingResponse> {
  return request<RescheduleBookingResponse>("/api/appointments/reschedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export interface CancelBookingResponse {
  message: string;
  appointment: Appointment;
}

export async function cancelBooking(
  token: string,
): Promise<CancelBookingResponse> {
  return request<CancelBookingResponse>("/api/appointments/cancel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });
}
