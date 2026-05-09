import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { getCurrentHousehold } from '@/lib/api/household';
import { PageHeader } from '@/components/feedback/PageHeader';
import { PlaceholderState } from '@/components/feedback/PlaceholderState';
import { TaskBoard } from './TaskBoard';
import type { DifficultyPreset, HouseholdMember, Task, TaskCompletion } from '@/types';

interface PaginatedResponse<T> {
  data: T[];
}

export default async function TasksPage() {
  const t = await getTranslations('nav');

  const household = await getCurrentHousehold();
  if (!household) {
    redirect('/onboarding');
  }

  const [tasksRes, presetsRes, membersRes, pendingRes] = await Promise.all([
    apiFetch<PaginatedResponse<Task>>(`/households/${household.id}/tasks?per_page=100`),
    apiFetch<PaginatedResponse<DifficultyPreset>>(
      `/difficulty-presets?household_id=${household.id}`,
    ),
    apiFetch<PaginatedResponse<HouseholdMember>>(`/households/${household.id}/members`),
    apiFetch<PaginatedResponse<TaskCompletion>>(
      `/households/${household.id}/task-completions/pending`,
    ),
  ]);

  if (!tasksRes.ok || !presetsRes.ok || !membersRes.ok) {
    return (
      <>
        <PageHeader title={t('tasks')} />
        <PlaceholderState />
      </>
    );
  }

  return (
    <TaskBoard
      householdId={household.id}
      householdName={household.name}
      tasks={tasksRes.data.data}
      presets={presetsRes.data.data}
      members={membersRes.data.data}
      pendingCompletions={pendingRes.ok ? pendingRes.data.data : []}
    />
  );
}
