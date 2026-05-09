'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { MissionCard } from '@/components/gamification/MissionCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { postJson } from '@/lib/api/browser';
import type { DifficultyKey, Mission } from '@/types';

interface KidsMissionListProps {
  householdId: number;
  missions: Mission[];
}

export function KidsMissionList({ householdId, missions }: KidsMissionListProps) {
  const router = useRouter();

  if (missions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Nenhuma missão ativa agora.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {missions.map((mission) => (
        <KidsMissionItem
          key={mission.id}
          mission={mission}
          householdId={householdId}
          onChange={() => router.refresh()}
        />
      ))}
    </div>
  );
}

function KidsMissionItem({
  mission,
  householdId,
  onChange,
}: {
  mission: Mission;
  householdId: number;
  onChange: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [doneFlash, setDoneFlash] = useState(false);
  const target = mission.target_value ?? 1;
  const current = mission.current_value ?? 0;

  return (
    <div className="space-y-2">
      <MissionCard
        name={mission.name}
        type={mission.mission_type}
        difficulty={(mission.difficulty?.key ?? 'easy') as DifficultyKey}
        points={mission.points_for_completion ?? mission.difficulty?.base_points ?? 0}
        current={current}
        target={target}
      />
      <div className="flex items-center justify-end gap-2">
        {mission.mission_type === 'count' || mission.mission_type === 'streak' ? (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await postJson(`/api/households/${householdId}/missions/${mission.id}/progress`, {
                  amount: 1,
                });
                onChange();
              })
            }
          >
            +1 hoje
          </Button>
        ) : null}
        <Button
          variant="kids"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await postJson(
                `/api/households/${householdId}/missions/${mission.id}/complete`,
                {},
              );
              if (result.ok) {
                setDoneFlash(true);
                setTimeout(() => setDoneFlash(false), 1200);
                onChange();
              }
            })
          }
        >
          Concluí!
        </Button>
      </div>

      {doneFlash ? (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-1 text-xs text-amber-700"
        >
          <Sparkles className="h-3 w-3" /> Pontos creditados (ou aguardando aprovação)!
        </motion.div>
      ) : null}
    </div>
  );
}
