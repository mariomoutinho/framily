'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'motion/react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TaskCard } from '@/components/gamification/TaskCard';
import { PageHeader } from '@/components/feedback/PageHeader';
import { FormError } from '@/components/feedback/FormError';
import { patchJson, postJson, type ApiErrorBody } from '@/lib/api/browser';
import type {
  DifficultyKey,
  DifficultyPreset,
  HouseholdMember,
  Task,
  TaskCompletion,
  TaskFrequency,
} from '@/types';

interface TaskBoardProps {
  householdId: number;
  householdName: string;
  tasks: Task[];
  presets: DifficultyPreset[];
  members: HouseholdMember[];
  pendingCompletions: TaskCompletion[];
}

type ToastState = {
  id: number;
  kind: 'success' | 'error';
  title: string;
  description: string;
};

const weekDays = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sab' },
  { value: 0, label: 'Dom' },
];

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
  const [localTasks, setLocalTasks] = useState(tasks);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openTasks = useMemo(
    () =>
      localTasks.filter(
        (task) =>
          (task.status === 'open' || task.status === 'in_progress') && !isCompletedToday(task),
      ),
    [localTasks],
  );

  const completedTasks = useMemo(
    () => localTasks.filter((task) => task.status === 'completed' || isCompletedToday(task)),
    [localTasks],
  );

  function openCreateForm() {
    setEditingTask(null);
    setShowForm(true);
  }

  function openEditForm(task: Task) {
    setEditingTask(task);
    setShowForm(true);
  }

  function closeForm() {
    setEditingTask(null);
    setShowForm(false);
  }

  function showToast(next: Omit<ToastState, 'id'>) {
    setToast({ id: Date.now(), ...next });
  }

  return (
    <>
      <PageHeader
        title={t('tasks')}
        description={`${householdName} · ${localTasks.length} tarefa(s)`}
        action={
          <Button onClick={showForm ? closeForm : openCreateForm}>
            {showForm ? 'Cancelar' : 'Nova tarefa'}
          </Button>
        }
      />

      <TaskToast toast={toast} />

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingTask ? 'Editar tarefa' : 'Nova tarefa'}</CardTitle>
            <CardDescription>
              Defina responsáveis, pontos e uma frequência que combine com a rotina.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TaskForm
              householdId={householdId}
              presets={presets}
              members={members}
              task={editingTask}
              onSaved={(savedTask) => {
                setLocalTasks((current) =>
                  editingTask
                    ? current.map((task) => (task.id === savedTask.id ? savedTask : task))
                    : [savedTask, ...current],
                );
                closeForm();
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
                tasks={localTasks}
                onResolved={() => router.refresh()}
                onToast={showToast}
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
                onEdit={() => openEditForm(task)}
                onCompleted={(completion) => {
                  setLocalTasks((current) =>
                    current.map((item) =>
                      item.id === task.id
                        ? {
                            ...item,
                            status: item.frequency === 'once' ? 'completed' : item.status,
                            completed_at: new Date().toISOString(),
                            last_completion: completion,
                          }
                        : item,
                    ),
                  );
                  showToast({
                    kind: 'success',
                    title: 'Tarefa concluída!',
                    description: `+${completion.points_awarded} pontos para a casa. Bom trabalho!`,
                  });
                  router.refresh();
                }}
                onError={(message) =>
                  showToast({
                    kind: 'error',
                    title: 'Não foi possível concluir',
                    description: message,
                  })
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Concluídas</h2>
        {completedTasks.length === 0 ? (
          <p className="rounded-md border border-dashed bg-card/70 p-6 text-center text-sm text-muted-foreground">
            As tarefas prontas aparecem aqui e continuam editáveis.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {completedTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                householdId={householdId}
                onEdit={() => openEditForm(task)}
                onCompleted={() => undefined}
                onError={(message) =>
                  showToast({
                    kind: 'error',
                    title: 'Não foi possível concluir',
                    description: message,
                  })
                }
                muted
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function difficultyKey(task: Task): DifficultyKey {
  return (task.difficulty?.key ?? 'easy') as DifficultyKey;
}

function isCompletedToday(task: Task): boolean {
  if (task.status === 'completed') return true;
  if (!task.completed_at) return false;

  const completed = new Date(task.completed_at);
  const today = new Date();

  return (
    completed.getFullYear() === today.getFullYear() &&
    completed.getMonth() === today.getMonth() &&
    completed.getDate() === today.getDate()
  );
}

function frequencyLabel(task: Task): string {
  if (task.frequency === 'daily') return 'Diária';
  if (task.frequency === 'weekly') return 'Semanal';
  if (task.frequency === 'monthly') return 'Mensal';
  if (task.frequency === 'weekdays') {
    const labels = weekDays
      .filter((day) => task.frequency_days?.includes(day.value))
      .map((day) => day.label);
    return labels.length ? labels.join(', ') : 'Dias específicos';
  }
  if (task.frequency === 'specific_dates') {
    return task.frequency_dates?.length
      ? `${task.frequency_dates.length} data(s)`
      : 'Datas específicas';
  }
  return 'Única';
}

function TaskRow({
  task,
  householdId,
  onCompleted,
  onError,
  onEdit,
  muted = false,
}: {
  task: Task;
  householdId: number;
  onCompleted: (completion: TaskCompletion) => void;
  onError: (message: string) => void;
  onEdit: () => void;
  muted?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const assigneeName = task.assignees?.[0]?.name;
  const points = task.points_for_completion ?? task.difficulty?.base_points ?? 0;
  const completed = task.status === 'completed' || isCompletedToday(task);

  return (
    <div className={muted ? 'opacity-80' : ''}>
      <TaskCard
        title={task.title}
        difficulty={difficultyKey(task)}
        points={points}
        dueLabel={task.due_at ? new Date(task.due_at).toLocaleDateString('pt-BR') : undefined}
        frequencyLabel={frequencyLabel(task)}
        assigneeName={assigneeName}
        completed={completed}
        completing={isPending}
        onEdit={onEdit}
        onComplete={
          completed
            ? undefined
            : () => {
                if (isPending) return;
                startTransition(async () => {
                  const result = await postJson<TaskCompletion>(
                    `/api/households/${householdId}/tasks/${task.id}/complete`,
                    {},
                  );

                  if (!result.ok) {
                    onError(
                      result.error?.message ?? 'A tarefa não foi concluída. Tente novamente.',
                    );
                    return;
                  }

                  onCompleted(result.data);
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
  onToast,
}: {
  householdId: number;
  completion: TaskCompletion;
  tasks: Task[];
  onResolved: () => void;
  onToast: (toast: Omit<ToastState, 'id'>) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const task = tasks.find((t) => t.id === completion.task_id);

  async function resolve(action: 'approve' | 'reject') {
    const result = await postJson(
      `/api/households/${householdId}/task-completions/${completion.id}/${action}`,
      {},
    );

    if (!result.ok) {
      onToast({
        kind: 'error',
        title: 'Ação não concluída',
        description: result.error?.message ?? 'Tente novamente em instantes.',
      });
      return;
    }

    onToast({
      kind: action === 'approve' ? 'success' : 'error',
      title: action === 'approve' ? 'Conclusão aprovada!' : 'Conclusão rejeitada',
      description:
        action === 'approve'
          ? `+${completion.points_awarded} pontos confirmados.`
          : 'Os pontos pendentes foram cancelados.',
    });
    onResolved();
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
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
          onClick={() => startTransition(() => resolve('reject'))}
        >
          Rejeitar
        </Button>
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => resolve('approve'))}
        >
          Aprovar
        </Button>
      </div>
    </div>
  );
}

function TaskForm({
  householdId,
  presets,
  members,
  task,
  onSaved,
}: {
  householdId: number;
  presets: DifficultyPreset[];
  members: HouseholdMember[];
  task: Task | null;
  onSaved: (task: Task) => void;
}) {
  const tDiff = useTranslations('gamification.difficulty');
  const [error, setError] = useState<ApiErrorBody['error']>();
  const [isPending, startTransition] = useTransition();
  const [frequency, setFrequency] = useState<TaskFrequency>(task?.frequency ?? 'once');
  const [selectedDays, setSelectedDays] = useState<number[]>(task?.frequency_days ?? []);
  const [selectedDates, setSelectedDates] = useState<string[]>(task?.frequency_dates ?? []);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const selectedPreset = presets.find((preset) => preset.id === task?.difficulty?.id) ?? presets[0];
  const [pointsPresetId, setPointsPresetId] = useState(selectedPreset?.id ?? 0);
  const selectedPoints = presets.find((preset) => preset.id === pointsPresetId)?.base_points ?? 0;

  function toggleDay(day: number) {
    setSelectedDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  }

  function toggleDate(date: string) {
    setSelectedDates((current) =>
      current.includes(date) ? current.filter((item) => item !== date) : [...current, date].sort(),
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const assignees = form.getAll('assignee_user_ids').map((v) => Number(v));
        setError(undefined);

        const payload = {
          title: form.get('title'),
          description: form.get('description') || undefined,
          difficulty_preset_id: Number(form.get('difficulty_preset_id')),
          priority: form.get('priority') ?? 'normal',
          frequency,
          frequency_days: frequency === 'weekdays' ? selectedDays : [],
          frequency_dates: frequency === 'specific_dates' ? selectedDates : [],
          due_at: form.get('due_at') || undefined,
          requires_approval: form.get('requires_approval') === 'on',
          assignee_user_ids: assignees,
        };

        startTransition(async () => {
          const result = task
            ? await patchJson<Task>(`/api/households/${householdId}/tasks/${task.id}`, payload)
            : await postJson<Task>(`/api/households/${householdId}/tasks`, payload);

          if (!result.ok) {
            setError(result.error);
            return;
          }

          onSaved(result.data);
        });
      }}
    >
      <FormError error={error} />

      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-1.5">
          <Label htmlFor="task-title">Título</Label>
          <Input
            id="task-title"
            name="title"
            required
            maxLength={200}
            defaultValue={task?.title ?? ''}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="task-points">Pontuação</Label>
          <Input id="task-points" value={`${selectedPoints} pts base`} readOnly />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="task-description">Descrição opcional</Label>
        <Input
          id="task-description"
          name="description"
          maxLength={2000}
          defaultValue={task?.description ?? ''}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="task-difficulty">Dificuldade</Label>
          <select
            id="task-difficulty"
            name="difficulty_preset_id"
            required
            defaultValue={task?.difficulty?.id ?? presets[0]?.id}
            onChange={(event) => setPointsPresetId(Number(event.currentTarget.value))}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {presets.map((preset) => {
              const label = ['easy', 'medium', 'hard', 'challenge'].includes(preset.key)
                ? tDiff(preset.key as 'easy' | 'medium' | 'hard' | 'challenge')
                : preset.key;
              return (
                <option key={preset.id} value={preset.id}>
                  {label} ({preset.base_points} pts)
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
            defaultValue={task?.priority ?? 'normal'}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="low">Baixa</option>
            <option value="normal">Normal</option>
            <option value="high">Alta (x1.25)</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Responsáveis</Label>
        <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-2">
          {members.map((member) => (
            <label key={member.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="assignee_user_ids"
                value={member.user_id}
                defaultChecked={task?.assignees?.some((user) => user.id === member.user_id)}
              />
              <span>
                {member.user?.name ?? `#${member.user_id}`}
                <span className="ml-1 text-xs text-muted-foreground">({member.role})</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <details className="rounded-md border bg-card/70 p-3" open={Boolean(task)}>
        <summary className="cursor-pointer text-sm font-semibold">Frequência avançada</summary>
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="task-frequency">Frequência</Label>
              <select
                id="task-frequency"
                value={frequency}
                onChange={(event) => setFrequency(event.currentTarget.value as TaskFrequency)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="once">Tarefa única</option>
                <option value="daily">Diária</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="weekdays">Dias específicos da semana</option>
                <option value="specific_dates">Datas específicas no calendário</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-due">Data ou prazo</Label>
              <Input
                id="task-due"
                name="due_at"
                type="datetime-local"
                defaultValue={toDateTimeLocal(task?.due_at)}
              />
            </div>
          </div>

          {frequency === 'weekdays' ? (
            <div className="space-y-2">
              <Label>Dias da semana</Label>
              <div className="flex flex-wrap gap-2">
                {weekDays.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={
                      selectedDays.includes(day.value)
                        ? 'rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground'
                        : 'rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground'
                    }
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {frequency === 'specific_dates' ? (
            <MiniCalendar
              month={calendarMonth}
              selectedDates={selectedDates}
              onMonthChange={setCalendarMonth}
              onToggleDate={toggleDate}
            />
          ) : null}
        </div>
      </details>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="requires_approval"
          defaultChecked={task?.requires_approval ?? true}
        />
        Exige aprovação adulta quando concluída por criança
      </label>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Salvando...' : task ? 'Salvar alterações' : 'Criar tarefa'}
      </Button>
    </form>
  );
}

function MiniCalendar({
  month,
  selectedDates,
  onMonthChange,
  onToggleDate,
}: {
  month: Date;
  selectedDates: string[];
  onMonthChange: (date: Date) => void;
  onToggleDate: (date: string) => void;
}) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leadingBlanks = firstDay.getDay();
  const cells = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  function moveMonth(delta: number) {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  }

  return (
    <div className="space-y-2 rounded-md border bg-background p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CalendarDays className="h-4 w-4 text-primary" />
          {month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </div>
        <div className="flex gap-1">
          <Button type="button" size="icon" variant="outline" onClick={() => moveMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="outline" onClick={() => moveMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (!day) return <span key={`blank-${index}`} className="aspect-square" />;
          const value = formatDate(new Date(month.getFullYear(), month.getMonth(), day));
          const selected = selectedDates.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggleDate(value)}
              className={
                selected
                  ? 'aspect-square rounded-md bg-primary text-sm font-semibold text-primary-foreground'
                  : 'aspect-square rounded-md border text-sm hover:bg-muted'
              }
            >
              {day}
            </button>
          );
        })}
      </div>
      {selectedDates.length > 0 ? (
        <div className="flex flex-wrap gap-1 pt-1">
          {selectedDates.map((date) => (
            <Badge key={date} variant="outline">
              {new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR')}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TaskToast({ toast }: { toast: ToastState | null }) {
  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          className="fixed right-4 top-4 z-50 w-[calc(100vw-2rem)] max-w-sm"
        >
          <div
            className={
              toast.kind === 'success'
                ? 'rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-lg'
                : 'rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive shadow-lg'
            }
          >
            <div className="flex items-start gap-3">
              {toast.kind === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5" />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5" />
              )}
              <div>
                <p className="font-semibold">{toast.title}</p>
                <p className="text-sm opacity-85">{toast.description}</p>
              </div>
              {toast.kind === 'success' ? <Sparkles className="ml-auto h-4 w-4" /> : null}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function toDateTimeLocal(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
