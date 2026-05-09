import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { getCurrentHousehold } from '@/lib/api/household';
import { PageHeader } from '@/components/feedback/PageHeader';
import { PlaceholderState } from '@/components/feedback/PlaceholderState';
import { MissionsBoard } from './MissionsBoard';
import type { DifficultyPreset, HouseholdMember, Mission, MissionTemplate } from '@/types';

interface PaginatedResponse<T> {
  data: T[];
}

export default async function MissionsPage() {
  const t = await getTranslations('nav');

  const household = await getCurrentHousehold();
  if (!household) redirect('/onboarding');

  const [missionsRes, templatesRes, presetsRes, membersRes] = await Promise.all([
    apiFetch<PaginatedResponse<Mission>>(`/households/${household.id}/missions?per_page=100`),
    apiFetch<PaginatedResponse<MissionTemplate>>('/mission-templates'),
    apiFetch<PaginatedResponse<DifficultyPreset>>(
      `/difficulty-presets?household_id=${household.id}`,
    ),
    apiFetch<PaginatedResponse<HouseholdMember>>(`/households/${household.id}/members`),
  ]);

  if (!missionsRes.ok || !templatesRes.ok || !presetsRes.ok || !membersRes.ok) {
    return (
      <>
        <PageHeader title={t('missions')} />
        <PlaceholderState />
      </>
    );
  }

  return (
    <MissionsBoard
      householdId={household.id}
      householdName={household.name}
      missions={missionsRes.data.data}
      templates={templatesRes.data.data}
      presets={presetsRes.data.data}
      members={membersRes.data.data}
    />
  );
}
