/**
 * Helper para resolver a casa atual do usuário no servidor.
 * MVP: retorna a primeira casa que o usuário pertence.
 * Futuro (Fase 5+): suportar múltiplas casas com seletor.
 */

import { apiFetch } from './client';
import type { Household } from '@/types';

interface HouseholdsResponse {
  data: Household[];
}

export async function getCurrentHousehold(): Promise<Household | null> {
  const result = await apiFetch<HouseholdsResponse>('/households');
  if (!result.ok) return null;
  return result.data.data[0] ?? null;
}
