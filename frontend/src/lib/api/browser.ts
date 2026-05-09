/**
 * Helpers para chamar as API routes do próprio Next.js a partir de client
 * components. Estes endpoints (em src/app/api/*) cuidam de injetar o token
 * Sanctum guardado no cookie httpOnly e do proxy para o backend Laravel.
 */

export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    message_key?: string;
    fields?: Record<string, string[]>;
  };
}

export async function postJson<T = unknown>(
  path: string,
  body: unknown,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: ApiErrorBody['error'] }> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    credentials: 'same-origin',
  });

  const payload = (await response.json().catch(() => null)) as (T & ApiErrorBody) | null;

  if (!response.ok) {
    return { ok: false, status: response.status, error: payload?.error };
  }

  return { ok: true, data: payload as T };
}

export async function getJson<T = unknown>(
  path: string,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: ApiErrorBody['error'] }> {
  const response = await fetch(path, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });

  const payload = (await response.json().catch(() => null)) as (T & ApiErrorBody) | null;

  if (!response.ok) {
    return { ok: false, status: response.status, error: payload?.error };
  }

  return { ok: true, data: payload as T };
}
