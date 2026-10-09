import type { ApiErrorBody, AuthSession } from '@foodcompare/shared-types';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || 'Request failed');
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code || 'UNKNOWN_ERROR';
    this.details = body.details;
  }
}

/* ------------------------------------------------------------------ */
/* In-memory access token + refresh handling                           */
/* ------------------------------------------------------------------ */

let accessToken: string | null = null;
let refreshPromise: Promise<AuthSession | null> | null = null;
let onSessionExpired: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

function parseErrorBody(payload: unknown, status: number): ApiErrorBody {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const body = (payload as { error?: Partial<ApiErrorBody> }).error;
    if (body && typeof body === 'object') {
      return {
        code: typeof body.code === 'string' ? body.code : 'UNKNOWN_ERROR',
        message: typeof body.message === 'string' ? body.message : 'Request failed',
        details: body.details,
      };
    }
  }
  return { code: 'UNKNOWN_ERROR', message: `Request failed with status ${status}` };
}

async function performRefresh(): Promise<AuthSession | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      setAccessToken(null);
      return null;
    }
    const payload = (await res.json()) as { data?: AuthSession };
    const session = payload?.data ?? null;
    setAccessToken(session?.accessToken ?? null);
    return session;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export function refreshSession(): Promise<AuthSession | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  cartId?: string | null;
  query?: Record<string, string | number | boolean | undefined | null>;
  skipRefresh?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export interface RequestResult<T> {
  data: T;
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const result = await apiRequestWithMeta<T>(path, options);
  return result.data;
}

export async function apiRequestWithMeta<T>(
  path: string,
  options: RequestOptions = {},
): Promise<RequestResult<T>> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.auth !== false && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  if (options.cartId) headers['x-cart-id'] = options.cartId;

  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && !options.skipRefresh && options.auth !== false) {
    const session = await refreshSession();
    if (session) {
      return apiRequestWithMeta<T>(path, { ...options, skipRefresh: true });
    }
    onSessionExpired?.();
  }

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, parseErrorBody(payload, res.status));
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    const record = payload as { data: T; meta?: RequestResult<T>['meta'] };
    return { data: record.data, meta: record.meta };
  }
  return { data: payload as T };
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  getWithMeta: <T>(path: string, options?: RequestOptions) =>
    apiRequestWithMeta<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
  publicGet: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET', auth: false }),
};
