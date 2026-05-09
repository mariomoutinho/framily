import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

export async function GET(req: Request, { params }: { params: Promise<{ household: string }> }) {
  const { household } = await params;
  const { search } = new URL(req.url);
  const result = await apiFetch(`/households/${household}/reward-redemptions${search}`);
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}
