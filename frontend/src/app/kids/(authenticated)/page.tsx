import { getTranslations } from 'next-intl/server';
import { apiFetch } from '@/lib/api/client';
import { getCurrentHousehold } from '@/lib/api/household';
import { findNextReward } from '@/lib/api/next-reward';
import { KidsHero } from '@/components/gamification/KidsHero';
import { PointsCard } from '@/components/gamification/PointsCard';
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

const KID_WEEK_GOAL = 50;

export default async function KidsDashboardPage() {
  const t = await getTranslations('kids');

  const household = await getCurrentHousehold();
  if (!household) {
    return (
      <div className="space-y-6">
        <KidsHero />
        <PlaceholderState />
      </div>
    );
  }

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

  const tasks = tasksRes.ok ? tasksRes.data.data : [];
  const missions = missionsRes.ok ? missionsRes.data.data : [];
  const rewards = rewardsRes.ok ? rewardsRes.data.data : [];
  const next = findNextReward(rewards, totals.all);

  return (
    <div className="space-y-6">
      <KidsHero />

      <section className="grid gap-3 sm:grid-cols-3">
        <PointsCard points={totals.all} delta={totals.week} />
        <WeeklyProgressCard goal={KID_WEEK_GOAL} achieved={totals.week} />
        <NextRewardCard
          rewardName={next?.reward.name ?? 'pedir uma recompensa'}
          pointsToGo={next?.pointsToGo ?? 0}
        />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">{t('myTasksToday')}</h2>
        {tasks.length === 0 ? (
          <PlaceholderState messageKey="tasks" />
        ) : (
          <div className="grid gap-3">
            {tasks.map((task) => (
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
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">{t('myMissions')}</h2>
        {missions.length === 0 ? (
          <PlaceholderState messageKey="missions" />
        ) : (
          <div className="grid gap-3">
            {missions.map((m) => (
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
      </section>
    </div>
  );
}
