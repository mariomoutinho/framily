import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { getCurrentHousehold } from '@/lib/api/household';
import { PageHeader } from '@/components/feedback/PageHeader';
import { CalendarTimeline } from './CalendarTimeline';
import type { CalendarResponse } from '@/types';

export default async function CalendarPage() {
  const t = await getTranslations('nav');
  const household = await getCurrentHousehold();
  if (!household) redirect('/onboarding');

  const result = await apiFetch<CalendarResponse>(
    `/households/${household.id}/calendar`,
  );

  const data: CalendarResponse = result.ok
    ? result.data
    : { from: '', to: '', types: [], events: [] };

  return (
    <>
      <PageHeader
        title={t('calendar')}
        description={`${household.name} · próximos 30 dias`}
      />
      <CalendarTimeline events={data.events} />
    </>
  );
}
