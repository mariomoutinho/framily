import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

export async function GET() {
  const result = await apiFetch('/mission-templates');
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}
