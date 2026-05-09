/**
 * Gestão de sessão server-side via cookie httpOnly.
 *
 * O cookie guarda o token Sanctum + role do backend. O JS do browser NUNCA
 * tem acesso ao token — qualquer ação autenticada passa por API routes do
 * Next.js que injetam o token no header Authorization para o Laravel.
 */

import { cookies } from 'next/headers';

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? 'framily_session';
const SESSION_SECURE = process.env.SESSION_COOKIE_SECURE === 'true';

export type UserRole = 'owner' | 'admin' | 'adult' | 'child';

export interface StoredSession {
  token: string;
  role: UserRole;
  abilities: string[];
}

function encode(session: StoredSession): string {
  return Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
}

function decode(value: string): StoredSession | null {
  try {
    const json = Buffer.from(value, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as StoredSession;
    if (!parsed?.token || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setSessionCookie(session: StoredSession) {
  const store = await cookies();
  store.set(SESSION_COOKIE, encode(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: SESSION_SECURE,
    path: '/',
    maxAge: session.role === 'child' ? 60 * 60 * 24 * 7 : 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function readSession(): Promise<StoredSession | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  return raw ? decode(raw) : null;
}

export async function readSessionToken(): Promise<string | null> {
  return (await readSession())?.token ?? null;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export { decode as decodeSession };
