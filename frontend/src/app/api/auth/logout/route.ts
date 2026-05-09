import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';
import { clearSessionCookie, readSession } from '@/lib/auth/session';

export async function POST() {
  const session = await readSession();
  if (session) {
    const path = session.role === 'child' ? '/kids/auth/logout' : '/auth/logout';
    await apiFetch(path, { method: 'POST' });
  }
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
