import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { getCurrentHousehold } from '@/lib/api/household';
import { PageHeader } from '@/components/feedback/PageHeader';
import { ShoppingBoard } from './ShoppingBoard';
import type { ShoppingList } from '@/types';

interface PaginatedResponse<T> {
  data: T[];
}

export default async function ShoppingPage() {
  const t = await getTranslations('nav');
  const household = await getCurrentHousehold();
  if (!household) redirect('/onboarding');

  const listsRes = await apiFetch<PaginatedResponse<ShoppingList>>(
    `/households/${household.id}/shopping-lists`,
  );
  const lists = listsRes.ok ? listsRes.data.data : [];

  // Para cada lista, busca os itens (mantém simples para o MVP).
  const listsWithItems = await Promise.all(
    lists.map(async (l) => {
      const detail = await apiFetch<{ data: ShoppingList }>(
        `/households/${household.id}/shopping-lists/${l.id}`,
      );
      return detail.ok ? detail.data.data : l;
    }),
  );

  return (
    <>
      <PageHeader title={t('shopping')} description={household.name} />
      <ShoppingBoard householdId={household.id} lists={listsWithItems} />
    </>
  );
}
