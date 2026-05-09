'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MissionCard } from '@/components/gamification/MissionCard';
import { PageHeader } from '@/components/feedback/PageHeader';
import { FormError } from '@/components/feedback/FormError';
import { postJson, type ApiErrorBody } from '@/lib/api/browser';
import type {
  DifficultyKey,
  DifficultyPreset,
  HouseholdMember,
  Mission,
  MissionTemplate,
  MissionType,
} from '@/types';

interface MissionsBoardProps {
  householdId: number;
  householdName: string;
  missions: Mission[];
  templates: MissionTemplate[];
  presets: DifficultyPreset[];
  members: HouseholdMember[];
}

export function MissionsBoard({
  householdId,
  householdName,
  missions,
  templates,
  presets,
  members,
}: MissionsBoardProps) {
  const t = useTranslations('nav');
  const tEmpty = useTranslations('empty');
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MissionTemplate | null>(null);

  const active = useMemo(() => missions.filter((m) => m.status === 'active'), [missions]);
  const completed = useMemo(() => missions.filter((m) => m.status === 'completed'), [missions]);

  return (
    <>
      <PageHeader
        title={t('missions')}
        description={`${householdName} · ${missions.length} missão(ões)`}
        action={
          <Button onClick={() => setCreating((v) => !v)}>
            {creating ? 'Cancelar' : 'Nova missão'}
          </Button>
        }
      />

      {creating ? (
        <div className="grid gap-3 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Modelos prontos</CardTitle>
              <CardDescription>Use um template para começar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`w-full rounded-md border p-2 text-left text-sm transition-colors ${
                    selectedTemplate?.id === tpl.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-accent'
                  }`}
                >
                  <p className="font-medium">{tpl.key}</p>
                  <p className="text-xs text-muted-foreground">
                    {tpl.mission_type} · {tpl.difficulty?.base_points ?? 0} pts
                    {tpl.is_collective ? ' · coletiva' : ''}
                  </p>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className={`w-full rounded-md border border-dashed p-2 text-left text-sm ${
                  selectedTemplate === null ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <p className="font-medium">+ Missão personalizada</p>
                <p className="text-xs text-muted-foreground">Configurar tudo manualmente.</p>
              </button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                {selectedTemplate ? `Criar a partir de "${selectedTemplate.key}"` : 'Missão personalizada'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CreateMissionForm
                householdId={householdId}
                template={selectedTemplate}
                presets={presets}
                members={members}
                onCreated={() => {
                  setCreating(false);
                  setSelectedTemplate(null);
                  router.refresh();
                }}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Ativas</h2>
        {active.length === 0 ? (
          <p className="rounded-md border bg-card p-6 text-center text-sm text-muted-foreground">
            {tEmpty('missions')}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {active.map((mission) => (
              <MissionRow
                key={mission.id}
                mission={mission}
                householdId={householdId}
                onChange={() => router.refresh()}
              />
            ))}
          </div>
        )}
      </section>

      {completed.length > 0 ? (
        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Concluídas</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {completed.map((mission) => (
              <div key={mission.id} className="opacity-60">
                <MissionRow mission={mission} householdId={householdId} onChange={() => router.refresh()} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function MissionRow({
  mission,
  householdId,
  onChange,
}: {
  mission: Mission;
  householdId: number;
  onChange: () => void;
}) {
  const [isPending, startTransition] = useTransition();
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
            disabled={isPending || mission.status !== 'active'}
            onClick={() =>
              startTransition(async () => {
                await postJson(`/api/households/${householdId}/missions/${mission.id}/progress`, {
                  amount: 1,
                });
                onChange();
              })
            }
          >
            +1 progresso
          </Button>
        ) : null}

        <Button
          size="sm"
          disabled={isPending || mission.status !== 'active'}
          onClick={() =>
            startTransition(async () => {
              await postJson(`/api/households/${householdId}/missions/${mission.id}/complete`, {});
              onChange();
            })
          }
        >
          Concluir
        </Button>
      </div>
      {mission.is_collective ? <Badge variant="secondary">Coletiva</Badge> : null}
    </div>
  );
}

function CreateMissionForm({
  householdId,
  template,
  presets,
  members,
  onCreated,
}: {
  householdId: number;
  template: MissionTemplate | null;
  presets: DifficultyPreset[];
  members: HouseholdMember[];
  onCreated: () => void;
}) {
  const tDiff = useTranslations('gamification.difficulty');
  const [error, setError] = useState<ApiErrorBody['error']>();
  const [isPending, startTransition] = useTransition();

  const defaultDifficulty = template?.difficulty?.id ?? presets[0]?.id;
  const defaultType: MissionType = template?.mission_type ?? 'single_task';
  const defaultName = template?.key ?? '';
  const defaultTarget = template?.default_target ?? '';
  const defaultCollective = template?.is_collective ?? false;

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const participants = form.getAll('participant_user_ids').map((v) => Number(v));
        setError(undefined);

        startTransition(async () => {
          const result = await postJson(`/api/households/${householdId}/missions`, {
            template_id: template?.id,
            name: form.get('name'),
            description: form.get('description') || undefined,
            mission_type: form.get('mission_type'),
            difficulty_preset_id: Number(form.get('difficulty_preset_id')),
            target_value: form.get('target_value') ? Number(form.get('target_value')) : undefined,
            requires_approval: form.get('requires_approval') === 'on',
            is_collective: form.get('is_collective') === 'on',
            participant_user_ids: participants,
          });

          if (!result.ok) {
            setError(result.error);
            return;
          }
          onCreated();
        });
      }}
    >
      <FormError error={error} />

      <div className="space-y-1.5">
        <Label htmlFor="m-name">Nome</Label>
        <Input id="m-name" name="name" defaultValue={defaultName} required maxLength={200} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="m-type">Tipo</Label>
          <select
            id="m-type"
            name="mission_type"
            defaultValue={defaultType}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="single_task">Tarefa única</option>
            <option value="recurring_task">Recorrente</option>
            <option value="streak">Sequência</option>
            <option value="count">Contagem</option>
            <option value="collective">Coletiva</option>
            <option value="custom">Personalizada</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="m-diff">Dificuldade</Label>
          <select
            id="m-diff"
            name="difficulty_preset_id"
            defaultValue={defaultDifficulty}
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
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="m-target">Meta numérica (opcional, p/ contagem/sequência)</Label>
        <Input
          id="m-target"
          name="target_value"
          type="number"
          min={0}
          max={9999}
          defaultValue={defaultTarget?.toString()}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Participantes</Label>
        <div className="grid grid-cols-2 gap-1 rounded-md border p-2">
          {members.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="participant_user_ids" value={m.user_id} />
              <span>
                {m.user?.name ?? `#${m.user_id}`}
                <span className="ml-1 text-xs text-muted-foreground">({m.role})</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="requires_approval" defaultChecked />
          Exige aprovação adulta para concluir
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_collective" defaultChecked={defaultCollective} />
          Missão coletiva (pontos para todos os participantes)
        </label>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? '…' : template ? 'Criar a partir do modelo' : 'Criar missão'}
      </Button>
    </form>
  );
}
