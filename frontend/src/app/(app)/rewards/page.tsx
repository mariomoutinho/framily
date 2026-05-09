import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { getCurrentHousehold } from '@/lib/api/household';
import { PageHeader } from '@/components/feedback/PageHeader';
import { PlaceholderState } from '@/components/feedback/PlaceholderState';
import { RewardsBoard } from './RewardsBoard';
import type { Reward, RewardRedemption } from '@/types';

interface PointsResponse {
  totals: { all: number; week: number; month: number; pending: number };
}

interface PaginatedResponse<T> {
  data: T[];
}

export default async function RewardsPage() {
  const t = await getTranslations('nav');

  const household = await getCurrentHousehold();
  if (!household) redirect('/onboarding');

  const [rewardsRes, redemptionsRes, pointsRes] = await Promise.all([
    apiFetch<PaginatedResponse<Reward>>(`/households/${household.id}/rewards`),
    apiFetch<PaginatedResponse<RewardRedemption>>(
      `/households/${household.id}/reward-redemptions?status=pending`,
    ),
    apiFetch<PointsResponse>(`/points/me?household_id=${household.id}`),
  ]);

  if (!rewardsRes.ok) {
    return (
      <>
        <PageHeader title={t('rewards')} />
        <PlaceholderState />
      </>
    );
  }

  return (
    <RewardsBoard
      householdId={household.id}
      householdName={household.name}
      rewards={rewardsRes.data.data}
      pendingRedemptions={redemptionsRes.ok ? redemptionsRes.data.data : []}
      myPoints={pointsRes.ok ? pointsRes.data.totals.all : 0}
    />
  );
}
