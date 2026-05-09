import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { getCurrentHousehold } from '@/lib/api/household';
import { PageHeader } from '@/components/feedback/PageHeader';
import { AchievementsGrid } from './AchievementsGrid';
import type { AchievementWithStatus } from '@/types';

interface MeResponse {
  unlocked_count: number;
  total_count: number;
  items: AchievementWithStatus[];
}

export default async function AchievementsPage() {
  const t = await getTranslations('achievements');
  const household = await getCurrentHousehold();
  if (!household) redirect('/onboarding');

  const result = await apiFetch<MeResponse>(
    `/achievements/me?household_id=${household.id}`,
  );

  const data: MeResponse = result.ok
    ? result.data
    : { unlocked_count: 0, total_count: 0, items: [] };

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('summary', { unlocked: data.unlocked_count, total: data.total_count })}
      />
      <AchievementsGrid items={data.items} />
    </>
  );
}
