'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { CheckCircle2, Hourglass } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { postJson } from '@/lib/api/browser';
import type { DifficultyKey, Task } from '@/types';

interface KidsTaskListProps {
  householdId: number;
  tasks: Task[];
}

export function KidsTaskList({ householdId, tasks }: KidsTaskListProps) {
  const router = useRouter();
  const open = tasks.filter((task) => task.status !== 'completed');
  const completed = tasks.filter((task) => task.status === 'completed');

  if (open.length === 0 && completed.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Nenhuma tarefa hoje. Aproveite para descansar! ✨
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {open.map((task) => (
        <KidsTaskItem
          key={task.id}
          task={task}
          householdId={householdId}
          onComplete={() => router.refresh()}
        />
      ))}

      {completed.length > 0 ? (
        <details className="rounded-md border bg-card p-3 text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            ✓ {completed.length} concluída(s)
          </summary>
          <div className="mt-2 space-y-1">
            {completed.map((task) => (
              <div key={task.id} className="text-xs text-muted-foreground line-through">
                {task.title}
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function KidsTaskItem({
  task,
  householdId,
  onComplete,
}: {
  task: Task;
  householdId: number;
  onComplete: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const points = task.points_for_completion ?? task.difficulty?.base_points ?? 0;
  const diffKey = (task.difficulty?.key ?? 'easy') as DifficultyKey;

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={diffKey}>{labelFor(diffKey)}</Badge>
            <span className="text-xs text-muted-foreground">+{points} pts</span>
          </div>
          <p className="font-medium leading-tight">{task.title}</p>
        </div>

        {done ? (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1 text-sm text-emerald-600"
          >
            <Hourglass className="h-4 w-4" />
            Aguardando aprovação
          </motion.div>
        ) : (
          <Button
            variant="kids"
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await postJson(
                  `/api/households/${householdId}/tasks/${task.id}/complete`,
                  {},
                );
                if (result.ok) {
                  setDone(true);
                  onComplete();
                }
              })
            }
          >
            <CheckCircle2 className="mr-1 h-4 w-4" />
            Concluí!
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function labelFor(key: DifficultyKey): string {
  return ({ easy: 'Fácil', medium: 'Médio', hard: 'Difícil', challenge: 'Desafio' } as const)[key];
}
