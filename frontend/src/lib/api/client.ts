/**
 * Cliente HTTP server-side para chamar o backend Laravel.
 *
 * Estratégia de autenticação:
 *   - O token Sanctum NUNCA é exposto ao browser.
 *   - Server components / API routes / server actions chamam este cliente,
 *     que lê o token de um cookie httpOnly (gerenciado pelos endpoints em
 *     src/app/api/auth/* e src/app/api/kids/auth/*).
 *   - Quando o frontend precisa atuar a partir do client component, ele
 *     bate em /api/* (Next.js) que faz proxy seguro para o Laravel.
 */

import { readSessionToken } from '@/lib/auth/session';
import type { ApiError } from '@/types';

function apiBaseUrl() {
  return process.env.API_URL ?? 'http://nginx:80/api';
}

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: ApiError['error'] };

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  json?: unknown;
  body?: BodyInit | null;
  token?: string | null; // override
  next?: { revalidate?: number; tags?: string[] };
}

export async function apiFetch<T = unknown>(
  path: string,
  { json, token, headers, ...rest }: ApiOptions = {},
): Promise<ApiResult<T>> {
  const url = path.startsWith('http')
    ? path
    : `${apiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

  const resolvedToken = token === undefined ? await readSessionToken() : token;

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
    ...((headers as Record<string, string>) ?? {}),
  };

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
    body: json !== undefined ? JSON.stringify(json) : (rest.body as BodyInit | null | undefined),
    cache: rest.cache ?? 'no-store',
  });

  const status = response.status;
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    const errorBody = (isJson ? (payload as ApiError) : null)?.error;
    return {
      ok: false,
      status,
      error: errorBody ?? {
        code: `http_${status}`,
        message: typeof payload === 'string' ? payload : 'Request failed',
      },
    };
  }

  return { ok: true, status, data: payload as T };
}
