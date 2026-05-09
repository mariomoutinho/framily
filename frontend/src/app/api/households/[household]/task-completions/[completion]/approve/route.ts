import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

export async function POST(
  _: Request,
  { params }: { params: Promise<{ household: string; completion: string }> },
) {
  const { household, completion } = await params;
  const result = await apiFetch(
    `/households/${household}/task-completions/${completion}/approve`,
    { method: 'POST' },
  );
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}
