import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';
import { readSession } from '@/lib/auth/session';

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const path = session.role === 'child' ? '/kids/me' : '/auth/me';
  const result = await apiFetch<{ user: unknown; abilities: string[] }>(path);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}
