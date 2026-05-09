import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

/**
 * Health do frontend — verifica também o backend para diagnosticar a Fase 1.
 */
export async function GET() {
  const backend = await apiFetch<{ status: string; app: string }>('/health');

  return NextResponse.json({
    frontend: 'ok',
    backend: backend.ok ? backend.data : { error: backend.error },
    time: new Date().toISOString(),
  });
}
