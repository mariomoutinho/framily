import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ household: string; reward: string }> },
) {
  const { household, reward } = await params;
  const body = await req.json().catch(() => ({}));
  const result = await apiFetch(`/households/${household}/rewards/${reward}`, {
    method: 'PATCH',
    json: body,
  });
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ household: string; reward: string }> },
) {
  const { household, reward } = await params;
  const result = await apiFetch(`/households/${household}/rewards/${reward}`, {
    method: 'DELETE',
  });
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}
