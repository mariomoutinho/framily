import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ household: string; list: string; item: string }> },
) {
  const { household, list, item } = await params;
  const result = await apiFetch(
    `/households/${household}/shopping-lists/${list}/items/${item}`,
    { method: 'DELETE' },
  );
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}
