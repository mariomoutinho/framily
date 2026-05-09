import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

export async function POST(
  _: Request,
  { params }: { params: Promise<{ household: string; mission: string }> },
) {
  const { household, mission } = await params;
  const result = await apiFetch(`/households/${household}/missions/${mission}/complete`, {
    method: 'POST',
  });
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}
