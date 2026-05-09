'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { RewardCard } from '@/components/gamification/RewardCard';
import { Card, CardContent } from '@/components/ui/card';
import { postJson } from '@/lib/api/browser';
import type { Reward } from '@/types';

interface KidsRewardsListProps {
  householdId: number;
  rewards: Reward[];
  myPoints: number;
}

export function KidsRewardsList({ householdId, rewards, myPoints }: KidsRewardsListProps) {
  const router = useRouter();
  const t = useTranslations('rewards');
  const [flash, setFlash] = useState<string | null>(null);

  if (rewards.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Ainda não há recompensas. Peça para um adulto criar algumas! 🎁
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {flash ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-800"
        >
          <Sparkles className="h-4 w-4" />
          {flash}
        </motion.div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {rewards.map((reward) => (
          <KidsRewardItem
            key={reward.id}
            reward={reward}
            myPoints={myPoints}
            householdId={householdId}
            onRedeemed={() => {
              setFlash('Pedido enviado! Aguardando aprovação.');
              router.refresh();
              setTimeout(() => setFlash(null), 3000);
            }}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

function KidsRewardItem({
  reward,
  myPoints,
  householdId,
  onRedeemed,
  t,
}: {
  reward: Reward;
  myPoints: number;
  householdId: number;
  onRedeemed: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [isPending, startTransition] = useTransition();
  const unlocked = (reward.is_available !== false) && myPoints >= reward.points_cost;
  const missing = Math.max(0, reward.points_cost - myPoints);

  return (
    <div className="space-y-1">
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
            if (result.ok) {
              onRedeemed();
            }
          });
        }}
      />
      {!unlocked ? (
        <p className="px-1 text-xs text-muted-foreground">
          {t('missingPoints', { points: missing })}
        </p>
      ) : null}
    </div>
  );
}
