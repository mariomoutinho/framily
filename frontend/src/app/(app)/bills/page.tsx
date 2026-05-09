import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { getCurrentHousehold } from '@/lib/api/household';
import { PageHeader } from '@/components/feedback/PageHeader';
import { BillsBoard } from './BillsBoard';
import type { Bill, HouseholdMember } from '@/types';

interface PaginatedResponse<T> {
  data: T[];
}

export default async function BillsPage() {
  const t = await getTranslations('nav');
  const household = await getCurrentHousehold();
  if (!household) redirect('/onboarding');

  const [billsRes, membersRes] = await Promise.all([
    apiFetch<PaginatedResponse<Bill>>(`/households/${household.id}/bills`),
    apiFetch<PaginatedResponse<HouseholdMember>>(`/households/${household.id}/members`),
  ]);

  const bills = billsRes.ok ? billsRes.data.data : [];
  const adultMembers = membersRes.ok
    ? membersRes.data.data.filter((m) => m.role !== 'child')
    : [];

  return (
    <>
      <PageHeader title={t('bills')} description={household.name} />
      <BillsBoard
        householdId={household.id}
        bills={bills}
        adultMembers={adultMembers}
      />
    </>
  );
}
