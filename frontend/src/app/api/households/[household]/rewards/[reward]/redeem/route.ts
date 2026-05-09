import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

export async function POST(
  _: Request,
  { params }: { params: Promise<{ household: string; reward: string }> },
) {
  const { household, reward } = await params;
  const result = await apiFetch(`/households/${household}/rewards/${reward}/redeem`, {
    method: 'POST',
  });
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}
