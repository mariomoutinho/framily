import type { Reward } from '@/types';

/**
 * Dada uma lista de recompensas e os pontos atuais do usuário, retorna a
 * próxima a ser desbloqueada (a mais barata acima do saldo) e quantos
 * pontos faltam.
 */
export function findNextReward(
  rewards: Reward[],
  myPoints: number,
): { reward: Reward; pointsToGo: number } | null {
  const candidates = rewards
    .filter((r) => r.is_active && (r.is_available ?? true))
    .filter((r) => r.points_cost > myPoints)
    .sort((a, b) => a.points_cost - b.points_cost);

  const reward = candidates[0];
  if (!reward) return null;
  return { reward, pointsToGo: Math.max(0, reward.points_cost - myPoints) };
}
