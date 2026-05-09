import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ household: string; task: string }> },
) {
  const { household, task } = await params;
  const body = await req.json().catch(() => ({}));
  const result = await apiFetch(`/households/${household}/tasks/${task}/complete`, {
    method: 'POST',
    json: body,
  });
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}
