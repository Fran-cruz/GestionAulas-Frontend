const API_URL = import.meta.env.VITE_API_URL ?? 'https://darkgray-bee-113622.hostingersite.com/api';

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  status: number;
  details: Record<string, string[]>;

  constructor(message: string, status: number, details: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function buildMessage(payload: ApiErrorPayload | null, fallback: string) {
  if (!payload) {
    return fallback;
  }

  if (payload.message) {
    return payload.message;
  }

  const firstFieldError = Object.values(payload.errors ?? {})[0]?.[0];
  return firstFieldError ?? fallback;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const requestedMethod = (init?.method ?? 'GET').toUpperCase();

  const needsOverride = requestedMethod === 'PATCH' || requestedMethod === 'PUT' || requestedMethod === 'DELETE';

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    method: needsOverride ? 'POST' : requestedMethod,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(needsOverride ? { 'X-HTTP-Method-Override': requestedMethod } : {}),
      ...init?.headers,
    },
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T | ApiErrorPayload) : null;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload | null;
    throw new ApiError(
        buildMessage(errorPayload, 'No se pudo completar la solicitud.'),
        response.status,
        errorPayload?.errors ?? {},
    );
  }

  return payload as T;
}