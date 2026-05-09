import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

export async function GET(req: Request, { params }: { params: Promise<{ household: string }> }) {
  const { household } = await params;
  const { search } = new URL(req.url);
  const result = await apiFetch(`/households/${household}/bills${search}`);
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}

export async function POST(req: Request, { params }: { params: Promise<{ household: string }> }) {
  const { household } = await params;
  const body = await req.json().catch(() => ({}));
  const result = await apiFetch(`/households/${household}/bills`, { method: 'POST', json: body });
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}
