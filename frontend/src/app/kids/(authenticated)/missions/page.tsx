import { getTranslations } from 'next-intl/server';
import { apiFetch } from '@/lib/api/client';
import { getCurrentHousehold } from '@/lib/api/household';
import { PageHeader } from '@/components/feedback/PageHeader';
import { PlaceholderState } from '@/components/feedback/PlaceholderState';
import { KidsMissionList } from './KidsMissionList';
import type { Mission } from '@/types';

interface PaginatedResponse<T> {
  data: T[];
}

export default async function KidsMissionsPage() {
  const t = await getTranslations('kids');

  const household = await getCurrentHousehold();
  if (!household) {
    return (
      <>
        <PageHeader title={t('myMissions')} />
        <PlaceholderState />
      </>
    );
  }

  const missionsRes = await apiFetch<PaginatedResponse<Mission>>(
    `/households/${household.id}/missions?status=active&per_page=100`,
  );

  if (!missionsRes.ok) {
    return (
      <>
        <PageHeader title={t('myMissions')} />
        <PlaceholderState />
      </>
    );
  }

  return (
    <>
      <PageHeader title={t('myMissions')} />
      <KidsMissionList householdId={household.id} missions={missionsRes.data.data} />
    </>
  );
}
