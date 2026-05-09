import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { getCurrentHousehold } from '@/lib/api/household';
import { PageHeader } from '@/components/feedback/PageHeader';
import { RemindersBoard } from './RemindersBoard';
import type { Reminder } from '@/types';

interface PaginatedResponse<T> {
  data: T[];
}

export default async function RemindersPage() {
  const t = await getTranslations('nav');
  const household = await getCurrentHousehold();
  if (!household) redirect('/onboarding');

  const result = await apiFetch<PaginatedResponse<Reminder>>(
    `/households/${household.id}/reminders`,
  );
  const reminders = result.ok ? result.data.data : [];

  return (
    <>
      <PageHeader title={t('reminders')} description={household.name} />
      <RemindersBoard householdId={household.id} reminders={reminders} />
    </>
  );
}
