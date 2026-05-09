import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

export async function GET(_: Request, { params }: { params: Promise<{ household: string }> }) {
  const { household } = await params;
  const result = await apiFetch(`/households/${household}/members`);
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}
