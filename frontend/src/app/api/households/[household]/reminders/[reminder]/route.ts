import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ household: string; reminder: string }> },
) {
  const { household, reminder } = await params;
  const body = await req.json().catch(() => ({}));
  const result = await apiFetch(`/households/${household}/reminders/${reminder}`, {
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
  { params }: { params: Promise<{ household: string; reminder: string }> },
) {
  const { household, reminder } = await params;
  const result = await apiFetch(`/households/${household}/reminders/${reminder}`, {
    method: 'DELETE',
  });
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}
