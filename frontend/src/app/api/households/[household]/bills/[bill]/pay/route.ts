import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

export async function POST(
  _: Request,
  { params }: { params: Promise<{ household: string; bill: string }> },
) {
  const { household, bill } = await params;
  const result = await apiFetch(`/households/${household}/bills/${bill}/pay`, { method: 'POST' });
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}
