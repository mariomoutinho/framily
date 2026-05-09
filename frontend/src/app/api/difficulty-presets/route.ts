import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

export async function GET(req: Request) {
  const { search } = new URL(req.url);
  const result = await apiFetch(`/difficulty-presets${search}`);
  return NextResponse.json(
    result.ok ? result.data : { error: result.error },
    { status: result.status },
  );
}
