'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RewardCard } from '@/components/gamification/RewardCard';
import { PageHeader } from '@/components/feedback/PageHeader';
import { FormError } from '@/components/feedback/FormError';
import { postJson, type ApiErrorBody } from '@/lib/api/browser';
import type { Reward, RewardRedemption } from '@/types';

interface RewardsBoardProps {
  householdId: number;
  householdName: string;
  rewards: Reward[];
  pendingRedemptions: RewardRedemption[];
  myPoints: number;
}

export function RewardsBoard({
  householdId,
  householdName,
  rewards,
  pendingRedemptions,
  myPoints,
}: RewardsBoardProps) {
  const t = useTranslations('rewards');
  const tNav = useTranslations('nav');
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title={tNav('rewards')}
        description={`${householdName} · você tem ${myPoints} pts`}
        action={
          <Button onClick={() => setCreating((v) => !v)}>
            {creating ? 'Cancelar' : t('newReward')}
          </Button>
        }
      />

      {creating ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('newReward')}</CardTitle>
            <CardDescription>Defina o nome e o custo em pontos.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateRewardForm
              householdId={householdId}
              onCreated={() => {
                setCreating(false);
                router.refresh();
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      {pendingRedemptions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('pendingApprovals')}</CardTitle>
            <CardDescription>
              {pendingRedemptions.length} pedido(s) aguardando aprovação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingRedemptions.map((red) => (
              <PendingRedemptionRow
                key={red.id}
                householdId={householdId}
                redemption={red}
                onResolved={() => router.refresh()}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">{t('catalog')}</h2>
        {rewards.length === 0 ? (
          <p className="rounded-md border bg-card p-6 text-center text-sm text-muted-foreground">
            Nenhuma recompensa configurada ainda.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rewards.map((reward) => (
              <RewardWithRedeem
                key={reward.id}
                reward={reward}
                myPoints={myPoints}
                householdId={householdId}
                onRedeem={() => router.refresh()}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function RewardWithRedeem({
  reward,
  myPoints,
  householdId,
  onRedeem,
}: {
  reward: Reward;
  myPoints: number;
  householdId: number;
  onRedeem: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const unlocked = reward.is_available !== false && myPoints >= reward.points_cost;

  return (
    <RewardCard
      name={reward.name}
      description={reward.description ?? undefined}
      pointsCost={reward.points_cost}
      unlocked={unlocked}
      onRedeem={() => {
        if (isPending) return;
        startTransition(async () => {
          const result = await postJson(
            `/api/households/${householdId}/rewards/${reward.id}/redeem`,
            {},
          );
          if (result.ok) onRedeem();
        });
      }}
    />
  );
}

function PendingRedemptionRow({
  householdId,
  redemption,
  onResolved,
}: {
  householdId: number;
  redemption: RewardRedemption;
  onResolved: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const act = (action: 'approve' | 'deny') =>
    startTransition(async () => {
      await postJson(
        `/api/households/${householdId}/reward-redemptions/${redemption.id}/${action}`,
        {},
      );
      onResolved();
    });

  return (
    <div className="flex items-center justify-between rounded-md border bg-card p-3">
      <div className="text-sm">
        <p className="font-medium">{redemption.reward?.name ?? `Recompensa #${redemption.reward_id}`}</p>
        <p className="text-xs text-muted-foreground">
          {redemption.requested_by?.name ?? '—'} · {redemption.points_spent} pts ·{' '}
          {new Date(redemption.created_at).toLocaleString('pt-BR')}
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => act('deny')}>
          Negar
        </Button>
        <Button size="sm" disabled={isPending} onClick={() => act('approve')}>
          Aprovar
        </Button>
      </div>
    </div>
  );
}

function CreateRewardForm({
  householdId,
  onCreated,
}: {
  householdId: number;
  onCreated: () => void;
}) {
  const [error, setError] = useState<ApiErrorBody['error']>();
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setError(undefined);

        startTransition(async () => {
          const result = await postJson(`/api/households/${householdId}/rewards`, {
            name: form.get('name'),
            description: form.get('description') || undefined,
            points_cost: Number(form.get('points_cost')),
            stock: form.get('stock') ? Number(form.get('stock')) : undefined,
            requires_approval: form.get('requires_approval') === 'on',
          });

          if (!result.ok) {
            setError(result.error);
            return;
          }
          (event.target as HTMLFormElement).reset();
          onCreated();
        });
      }}
    >
      <FormError error={error} />

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="r-name">Nome</Label>
          <Input id="r-name" name="name" required maxLength={200} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="r-cost">Custo (pts)</Label>
          <Input id="r-cost" name="points_cost" type="number" required min={1} max={99999} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="r-desc">Descrição (opcional)</Label>
        <Input id="r-desc" name="description" maxLength={2000} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="r-stock">Estoque (opcional, vazio = ilimitado)</Label>
          <Input id="r-stock" name="stock" type="number" min={0} max={9999} />
        </div>
        <label className="mt-7 flex items-center gap-2 text-sm">
          <input type="checkbox" name="requires_approval" defaultChecked />
          Exige aprovação
        </label>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? '…' : 'Criar recompensa'}
      </Button>

      <p className="text-xs text-muted-foreground">
        <Badge variant="outline">Dica</Badge> recompensas comuns: 30 min de TV (50 pts), passeio
        (200 pts), brinquedo novo (500 pts).
      </p>
    </form>
  );
}
