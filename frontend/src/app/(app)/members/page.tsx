import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { PageHeader } from '@/components/feedback/PageHeader';
import { PlaceholderState } from '@/components/feedback/PlaceholderState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateChildForm } from './CreateChildForm';
import { CreateInviteForm } from './CreateInviteForm';
import type { Household, HouseholdMember } from '@/types';

interface HouseholdsResponse {
  data: Household[];
}

interface MembersResponse {
  data: HouseholdMember[];
}

export default async function MembersPage() {
  const t = await getTranslations('nav');
  const empty = await getTranslations('empty');

  const householdsResult = await apiFetch<HouseholdsResponse>('/households');

  if (!householdsResult.ok) {
    return (
      <>
        <PageHeader title={t('members')} />
        <PlaceholderState />
      </>
    );
  }

  const households = householdsResult.data.data;
  if (households.length === 0) {
    redirect('/onboarding');
  }

  // MVP: usamos a primeira casa do usuário. Multi-casa entra na Fase 5+.
  const household = households[0];

  const membersResult = await apiFetch<MembersResponse>(
    `/households/${household.id}/members`,
  );
  const members: HouseholdMember[] = membersResult.ok ? membersResult.data.data : [];
  const adultMembers = members.filter((m) => m.role !== 'child');

  return (
    <>
      <PageHeader
        title={t('members')}
        description={household.name + ' · código ' + (household.invite_code ?? '—')}
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Membros</CardTitle>
              <CardDescription>
                {members.length === 0 ? empty('members') : `${members.length} pessoa(s) na casa`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {members.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {empty('members')}
                </div>
              ) : (
                <ul className="divide-y">
                  {members.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 p-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {m.user?.name?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{m.user?.name}</p>
                        <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                      </div>
                      <Badge variant={roleBadgeVariant(m.role)}>{labelForRole(m.role)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar criança</CardTitle>
              <CardDescription>
                Crie uma conta infantil com login próprio e responsável.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateChildForm
                householdId={household.id}
                guardianOptions={adultMembers.map((m) => ({
                  id: m.user_id,
                  name: m.user?.name ?? `#${m.user_id}`,
                }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gerar convite</CardTitle>
              <CardDescription>Crie um código para convidar outro adulto.</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateInviteForm householdId={household.id} />
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}

function labelForRole(role: HouseholdMember['role']) {
  return (
    {
      owner: 'Dono(a) da casa',
      admin: 'Administrador',
      adult: 'Adulto',
      child: 'Criança',
    } as const
  )[role];
}

function roleBadgeVariant(
  role: HouseholdMember['role'],
): 'default' | 'secondary' | 'outline' | 'easy' | 'medium' | 'hard' | 'challenge' {
  switch (role) {
    case 'owner':
      return 'default';
    case 'admin':
      return 'secondary';
    case 'child':
      return 'easy';
    default:
      return 'outline';
  }
}
