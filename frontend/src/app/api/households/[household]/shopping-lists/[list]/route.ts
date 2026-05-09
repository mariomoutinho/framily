import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ household: string; list: string }> },
) {
  const { household, list } = await params;
  const result = await apiFetch(`/households/${household}/shopping-lists/${list}`);
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ household: string; list: string }> },
) {
  const { household, list } = await params;
  const body = await req.json().catch(() => ({}));
  const result = await apiFetch(`/households/${household}/shopping-lists/${list}`, {
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
  { params }: { params: Promise<{ household: string; list: string }> },
) {
  const { household, list } = await params;
  const result = await apiFetch(`/households/${household}/shopping-lists/${list}`, {
    method: 'DELETE',
  });
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}
