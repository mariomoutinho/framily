import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';
import { setSessionCookie } from '@/lib/auth/session';

interface LoginResponse {
  user: { id: number; role: 'owner' | 'admin' | 'adult' | 'child' };
  token: string;
  abilities: string[];
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const result = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    json: body,
    token: null, // chamada não autenticada
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await setSessionCookie({
    token: result.data.token,
    role: result.data.user.role,
    abilities: result.data.abilities,
  });

  return NextResponse.json({ user: result.data.user, abilities: result.data.abilities });
}
