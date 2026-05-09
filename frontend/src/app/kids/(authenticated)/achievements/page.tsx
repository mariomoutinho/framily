import { getTranslations } from 'next-intl/server';
import { apiFetch } from '@/lib/api/client';
import { getCurrentHousehold } from '@/lib/api/household';
import { PageHeader } from '@/components/feedback/PageHeader';
import { AchievementsGrid } from '@/app/(app)/achievements/AchievementsGrid';
import type { AchievementWithStatus } from '@/types';

interface MeResponse {
  unlocked_count: number;
  total_count: number;
  items: AchievementWithStatus[];
}

export default async function KidsAchievementsPage() {
  const t = await getTranslations('kids');
  const tAch = await getTranslations('achievements');
  const household = await getCurrentHousehold();

  const householdSuffix = household ? `?household_id=${household.id}` : '';
  const result = await apiFetch<MeResponse>(`/achievements/me${householdSuffix}`);
  const data: MeResponse = result.ok
    ? result.data
    : { unlocked_count: 0, total_count: 0, items: [] };

  return (
    <>
      <PageHeader
        title={t('myAchievements')}
        description={tAch('summary', { unlocked: data.unlocked_count, total: data.total_count })}
      />
      <AchievementsGrid items={data.items} />
    </>
  );
}
