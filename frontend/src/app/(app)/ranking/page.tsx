import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { getCurrentHousehold } from '@/lib/api/household';
import { PageHeader } from '@/components/feedback/PageHeader';
import { RankingView } from './RankingView';
import type { RankingEntry } from '@/types';

interface RankingResponse {
  scope: 'week' | 'month' | 'all';
  entries: RankingEntry[];
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: 'week' | 'month' | 'all' }>;
}) {
  const t = await getTranslations('ranking');
  const params = await searchParams;
  const scope = params.scope ?? 'week';

  const household = await getCurrentHousehold();
  if (!household) redirect('/onboarding');

  const result = await apiFetch<RankingResponse>(
    `/households/${household.id}/points?scope=${scope}`,
  );

  return (
    <>
      <PageHeader title={t('title')} description={household.name} />
      <RankingView scope={scope} entries={result.ok ? result.data.entries : []} />
    </>
  );
}
