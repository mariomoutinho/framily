'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TaskCard } from '@/components/gamification/TaskCard';
import { PageHeader } from '@/components/feedback/PageHeader';
import { FormError } from '@/components/feedback/FormError';
import { postJson, type ApiErrorBody } from '@/lib/api/browser';
import type { DifficultyKey, DifficultyPreset, HouseholdMember, Task, TaskCompletion } from '@/types';

interface TaskBoardProps {
  householdId: number;
  householdName: string;
  tasks: Task[];
  presets: DifficultyPreset[];
  members: HouseholdMember[];
  pendingCompletions: TaskCompletion[];
}

export function TaskBoard({
  householdId,
  householdName,
  tasks,
  presets,
  members,
  pendingCompletions,
}: TaskBoardProps) {
  const t = useTranslations('nav');
  const tEmpty = useTranslations('empty');
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status === 'open' || task.status === 'in_progress'),
    [tasks],
  );
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === 'completed'),
    [tasks],
  );

  return (
    <>
      <PageHeader
        title={t('tasks')}
        description={`${householdName} · ${tasks.length} tarefa(s)`}
        action={
          <Button onClick={() => setCreating((v) => !v)}>
            {creating ? 'Cancelar' : 'Nova tarefa'}
          </Button>
        }
      />

      {creating ? (
        <Card>
          <CardHeader>
            <CardTitle>Nova tarefa</CardTitle>
            <CardDescription>Defina título, dificuldade e quem realiza.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateTaskForm
              householdId={householdId}
              presets={presets}
              members={members}
              onCreated={() => {
                setCreating(false);
                router.refresh();
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      {pendingCompletions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aprovações pendentes</CardTitle>
            <CardDescription>
              {pendingCompletions.length} conclusão(ões) aguardando sua aprovação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingCompletions.map((completion) => (
              <PendingCompletionRow
                key={completion.id}
                householdId={householdId}
                completion={completion}
                tasks={tasks}
                onResolved={() => router.refresh()}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Em aberto</h2>
        {openTasks.length === 0 ? (
          <p className="rounded-md border bg-card p-6 text-center text-sm text-muted-foreground">
            {tEmpty('tasks')}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {openTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                householdId={householdId}
                onChange={() => router.refresh()}
              />
            ))}
          </div>
        )}
      </section>

      {completedTasks.length > 0 ? (
        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Concluídas</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {completedTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                householdId={householdId}
                onChange={() => router.refresh()}
                muted
              />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function difficultyKey(task: Task): DifficultyKey {
  return (task.difficulty?.key ?? 'easy') as DifficultyKey;
}

function TaskRow({
  task,
  householdId,
  onChange,
  muted = false,
}: {
  task: Task;
  householdId: number;
  onChange: () => void;
  muted?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const assigneeName = task.assignees?.[0]?.name;

  return (
    <div className={muted ? 'opacity-60' : ''}>
      <TaskCard
        title={task.title}
        difficulty={difficultyKey(task)}
        points={task.points_for_completion ?? task.difficulty?.base_points ?? 0}
        dueLabel={task.due_at ? new Date(task.due_at).toLocaleDateString('pt-BR') : ''}
        assigneeName={assigneeName}
        onComplete={
          task.status === 'completed'
            ? undefined
            : () => {
                if (isPending) return;
                startTransition(async () => {
                  await postJson(
                    `/api/households/${householdId}/tasks/${task.id}/complete`,
                    {},
                  );
                  onChange();
                });
              }
        }
      />
    </div>
  );
}

function PendingCompletionRow({
  householdId,
  completion,
  tasks,
  onResolved,
}: {
  householdId: number;
  completion: TaskCompletion;
  tasks: Task[];
  onResolved: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const task = tasks.find((t) => t.id === completion.task_id);

  return (
    <div className="flex items-center justify-between rounded-md border bg-card p-3">
      <div className="text-sm">
        <p className="font-medium">{task?.title ?? `Tarefa #${completion.task_id}`}</p>
        <p className="text-xs text-muted-foreground">
          Por {completion.completed_by?.name ?? 'desconhecido'} ·{' '}
          {new Date(completion.completed_at).toLocaleString('pt-BR')} ·{' '}
          <Badge variant="outline">+{completion.points_awarded} pts</Badge>
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await postJson(
                `/api/households/${householdId}/task-completions/${completion.id}/reject`,
                {},
              );
              onResolved();
            })
          }
        >
          Rejeitar
        </Button>
        <Button
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await postJson(
                `/api/households/${householdId}/task-completions/${completion.id}/approve`,
                {},
              );
              onResolved();
            })
          }
        >
          Aprovar
        </Button>
      </div>
    </div>
  );
}

function CreateTaskForm({
  householdId,
  presets,
  members,
  onCreated,
}: {
  householdId: number;
  presets: DifficultyPreset[];
  members: HouseholdMember[];
  onCreated: () => void;
}) {
  const tDiff = useTranslations('gamification.difficulty');
  const [error, setError] = useState<ApiErrorBody['error']>();
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const assignees = form.getAll('assignee_user_ids').map((v) => Number(v));
        setError(undefined);

        startTransition(async () => {
          const result = await postJson(`/api/households/${householdId}/tasks`, {
            title: form.get('title'),
            description: form.get('description') || undefined,
            difficulty_preset_id: Number(form.get('difficulty_preset_id')),
            priority: form.get('priority') ?? 'normal',
            frequency: form.get('frequency') ?? 'once',
            due_at: form.get('due_at') || undefined,
            requires_approval: form.get('requires_approval') === 'on',
            assignee_user_ids: assignees,
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

      <div className="space-y-1.5">
        <Label htmlFor="task-title">Título</Label>
        <Input id="task-title" name="title" required maxLength={200} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="task-difficulty">Dificuldade</Label>
          <select
            id="task-difficulty"
            name="difficulty_preset_id"
            required
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {presets.map((p) => {
              const label = ['easy', 'medium', 'hard', 'challenge'].includes(p.key)
                ? tDiff(p.key as 'easy' | 'medium' | 'hard' | 'challenge')
                : p.key;
              return (
                <option key={p.id} value={p.id}>
                  {label} ({p.base_points} pts)
                </option>
              );
            })}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="task-priority">Prioridade</Label>
          <select
            id="task-priority"
            name="priority"
            defaultValue="normal"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="low">Baixa</option>
            <option value="normal">Normal</option>
            <option value="high">Alta (×1.25)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="task-frequency">Frequência</Label>
          <select
            id="task-frequency"
            name="frequency"
            defaultValue="once"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="once">Única</option>
            <option value="daily">Diária</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="task-due">Prazo (opcional)</Label>
          <Input id="task-due" name="due_at" type="datetime-local" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Responsáveis</Label>
        <div className="grid grid-cols-2 gap-1 rounded-md border p-2">
          {members.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="assignee_user_ids" value={m.user_id} />
              <span>
                {m.user?.name ?? `#${m.user_id}`}
                <span className="ml-1 text-xs text-muted-foreground">({m.role})</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="requires_approval" defaultChecked />
        Exige aprovação adulta quando concluída por criança
      </label>

      <Button type="submit" disabled={isPending}>
        {isPending ? '…' : 'Criar tarefa'}
      </Button>
    </form>
  );
}
