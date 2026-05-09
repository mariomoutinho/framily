import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ household: string; mission: string }> },
) {
  const { household, mission } = await params;
  const body = await req.json().catch(() => ({}));
  const result = await apiFetch(`/households/${household}/missions/${mission}/progress`, {
    method: 'POST',
    json: body,
  });
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}
