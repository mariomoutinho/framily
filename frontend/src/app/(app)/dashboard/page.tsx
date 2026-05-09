import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { getCurrentHousehold } from '@/lib/api/household';
import { findNextReward } from '@/lib/api/next-reward';
import { PageHeader } from '@/components/feedback/PageHeader';
import { PointsCard } from '@/components/gamification/PointsCard';
import { LevelCard } from '@/components/gamification/LevelCard';
import { WeeklyProgressCard } from '@/components/gamification/WeeklyProgressCard';
import { NextRewardCard } from '@/components/gamification/NextRewardCard';
import { TaskCard } from '@/components/gamification/TaskCard';
import { MissionCard } from '@/components/gamification/MissionCard';
import { PlaceholderState } from '@/components/feedback/PlaceholderState';
import type { DifficultyKey, Mission, Reward, Task } from '@/types';

interface PointsResponse {
  totals: { all: number; week: number; month: number; pending: number };
}

interface PaginatedResponse<T> {
  data: T[];
}

const WEEK_GOAL = 100;

function levelFor(points: number) {
  const POINTS_PER_LEVEL = 250;
  const level = Math.max(1, Math.floor(points / POINTS_PER_LEVEL) + 1);
  const remainder = points % POINTS_PER_LEVEL;
  const progress = Math.round((remainder / POINTS_PER_LEVEL) * 100);
  return { level, progress };
}

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');

  const household = await getCurrentHousehold();
  if (!household) redirect('/onboarding');

  const [pointsRes, tasksRes, missionsRes, rewardsRes] = await Promise.all([
    apiFetch<PointsResponse>(`/points/me?household_id=${household.id}`),
    apiFetch<PaginatedResponse<Task>>(
      `/households/${household.id}/tasks?status=open&per_page=5`,
    ),
    apiFetch<PaginatedResponse<Mission>>(
      `/households/${household.id}/missions?status=active&per_page=5`,
    ),
    apiFetch<PaginatedResponse<Reward>>(`/households/${household.id}/rewards`),
  ]);

  const totals = pointsRes.ok
    ? pointsRes.data.totals
    : { all: 0, week: 0, month: 0, pending: 0 };
  const { level, progress } = levelFor(totals.all);

  const rewards = rewardsRes.ok ? rewardsRes.data.data : [];
  const next = findNextReward(rewards, totals.all);

  return (
    <>
      <PageHeader title={t('welcome')} description={`${t('summary')} · ${household.name}`} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PointsCard points={totals.all} delta={totals.week} />
        <LevelCard level={level} progress={progress} />
        <WeeklyProgressCard goal={WEEK_GOAL} achieved={totals.week} />
        <NextRewardCard
          rewardName={next?.reward.name ?? 'sem recompensas'}
          pointsToGo={next?.pointsToGo ?? 0}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            {t('upcomingTasks')}
          </h2>
          {!tasksRes.ok || tasksRes.data.data.length === 0 ? (
            <PlaceholderState messageKey="tasks" />
          ) : (
            <div className="grid gap-3">
              {tasksRes.data.data.map((task) => (
                <TaskCard
                  key={task.id}
                  title={task.title}
                  difficulty={(task.difficulty?.key ?? 'easy') as DifficultyKey}
                  points={task.points_for_completion ?? task.difficulty?.base_points ?? 0}
                  dueLabel={task.due_at ? new Date(task.due_at).toLocaleDateString('pt-BR') : ''}
                  assigneeName={task.assignees?.[0]?.name}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            {t('activeMissions')}
          </h2>
          {!missionsRes.ok || missionsRes.data.data.length === 0 ? (
            <PlaceholderState messageKey="missions" />
          ) : (
            <div className="grid gap-3">
              {missionsRes.data.data.map((m) => (
                <MissionCard
                  key={m.id}
                  name={m.name}
                  type={m.mission_type}
                  difficulty={(m.difficulty?.key ?? 'easy') as DifficultyKey}
                  points={m.points_for_completion ?? m.difficulty?.base_points ?? 0}
                  current={m.current_value ?? 0}
                  target={m.target_value ?? 1}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
