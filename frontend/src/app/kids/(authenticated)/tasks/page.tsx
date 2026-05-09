import { getTranslations } from 'next-intl/server';
import { apiFetch } from '@/lib/api/client';
import { getCurrentHousehold } from '@/lib/api/household';
import { PageHeader } from '@/components/feedback/PageHeader';
import { PlaceholderState } from '@/components/feedback/PlaceholderState';
import { KidsTaskList } from './KidsTaskList';
import type { Task } from '@/types';

interface PaginatedResponse<T> {
  data: T[];
}

export default async function KidsTasksPage() {
  const t = await getTranslations('kids');

  const household = await getCurrentHousehold();
  if (!household) {
    return (
      <>
        <PageHeader title={t('myTasksToday')} />
        <PlaceholderState />
      </>
    );
  }

  const tasksRes = await apiFetch<PaginatedResponse<Task>>(
    `/households/${household.id}/tasks?per_page=100`,
  );

  if (!tasksRes.ok) {
    return (
      <>
        <PageHeader title={t('myTasksToday')} />
        <PlaceholderState />
      </>
    );
  }

  return (
    <>
      <PageHeader title={t('myTasksToday')} />
      <KidsTaskList householdId={household.id} tasks={tasksRes.data.data} />
    </>
  );
}
