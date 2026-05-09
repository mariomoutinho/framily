import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

const ALLOWED = new Set(['approve', 'deny', 'deliver']);

export async function POST(
  _: Request,
  { params }: { params: Promise<{ household: string; redemption: string; action: string }> },
) {
  const { household, redemption, action } = await params;
  if (!ALLOWED.has(action)) {
    return NextResponse.json({ error: { code: 'invalid_action' } }, { status: 400 });
  }

  const result = await apiFetch(
    `/households/${household}/reward-redemptions/${redemption}/${action}`,
    { method: 'POST' },
  );
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}
