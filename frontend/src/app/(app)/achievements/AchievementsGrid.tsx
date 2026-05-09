'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeCard } from '@/components/gamification/BadgeCard';
import type { AchievementWithStatus } from '@/types';

interface AchievementsGridProps {
  items: AchievementWithStatus[];
}

export function AchievementsGrid({ items }: AchievementsGridProps) {
  const t = useTranslations('achievements');
  const unlocked = items.filter((a) => a.unlocked);
  const locked = items.filter((a) => !a.unlocked);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('unlocked')}</CardTitle>
          <CardDescription>{unlocked.length} conquista(s).</CardDescription>
        </CardHeader>
        <CardContent>
          {unlocked.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Conclua tarefas e missões para desbloquear conquistas.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
              {unlocked.map((a) => (
                <AchievementBadge key={a.id} item={a} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('locked')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
            {locked.map((a) => (
              <AchievementBadge key={a.id} item={a} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AchievementBadge({ item }: { item: AchievementWithStatus }) {
  const t = useTranslations('achievements');
  const fallback = item.key;

  // tenta achievements.<key>.name / .description; se a chave não existir no
  // bundle de tradução, cai no fallback (key + descrição vinda do servidor)
  let name = fallback;
  let description: string | undefined;
  try {
    name = t(`${item.key}.name`);
    description = t(`${item.key}.description`);
  } catch {
    // ok — fallback
  }

  return <BadgeCard name={name} description={description} unlocked={item.unlocked} />;
}
