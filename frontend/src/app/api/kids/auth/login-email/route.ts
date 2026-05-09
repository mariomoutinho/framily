import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';
import { setSessionCookie } from '@/lib/auth/session';

interface ChildLoginResponse {
  user: { id: number; role: 'child' };
  token: string;
  abilities: string[];
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const result = await apiFetch<ChildLoginResponse>('/kids/auth/login-email', {
    method: 'POST',
    json: body,
    token: null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await setSessionCookie({
    token: result.data.token,
    role: 'child',
    abilities: result.data.abilities,
  });

  return NextResponse.json({ user: result.data.user, abilities: result.data.abilities });
}
