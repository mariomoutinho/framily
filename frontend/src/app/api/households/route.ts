import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

export async function GET() {
  const result = await apiFetch('/households');
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const result = await apiFetch('/households', { method: 'POST', json: body });
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}
