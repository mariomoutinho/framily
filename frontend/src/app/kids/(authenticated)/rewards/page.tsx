import { getTranslations } from 'next-intl/server';
import { apiFetch } from '@/lib/api/client';
import { getCurrentHousehold } from '@/lib/api/household';
import { PageHeader } from '@/components/feedback/PageHeader';
import { PlaceholderState } from '@/components/feedback/PlaceholderState';
import { KidsRewardsList } from './KidsRewardsList';
import type { Reward } from '@/types';

interface PointsResponse {
  totals: { all: number; week: number; month: number; pending: number };
}

interface PaginatedResponse<T> {
  data: T[];
}

export default async function KidsRewardsPage() {
  const t = await getTranslations('nav');

  const household = await getCurrentHousehold();
  if (!household) {
    return (
      <>
        <PageHeader title={t('rewards')} />
        <PlaceholderState />
      </>
    );
  }

  const [rewardsRes, pointsRes] = await Promise.all([
    apiFetch<PaginatedResponse<Reward>>(`/households/${household.id}/rewards`),
    apiFetch<PointsResponse>(`/points/me?household_id=${household.id}`),
  ]);

  const rewards = rewardsRes.ok ? rewardsRes.data.data : [];
  const points = pointsRes.ok ? pointsRes.data.totals.all : 0;

  return (
    <>
      <PageHeader title={t('rewards')} description={`Você tem ${points} pts`} />
      <KidsRewardsList householdId={household.id} rewards={rewards} myPoints={points} />
    </>
  );
}
