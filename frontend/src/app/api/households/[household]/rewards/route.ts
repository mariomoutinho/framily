import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

export async function GET(_: Request, { params }: { params: Promise<{ household: string }> }) {
  const { household } = await params;
  const result = await apiFetch(`/households/${household}/rewards`);
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}

export async function POST(req: Request, { params }: { params: Promise<{ household: string }> }) {
  const { household } = await params;
  const body = await req.json().catch(() => ({}));
  const result = await apiFetch(`/households/${household}/rewards`, { method: 'POST', json: body });
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}
