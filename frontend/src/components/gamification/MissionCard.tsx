import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { DifficultyKey, MissionType } from '@/types';

interface MissionCardProps {
  name: string;
  type: MissionType;
  difficulty: DifficultyKey;
  points: number;
  current: number;
  target: number;
  rewardName?: string;
}

export function MissionCard({
  name,
  type,
  difficulty,
  points,
  current,
  target,
  rewardName,
}: MissionCardProps) {
  const tDiff = useTranslations('gamification.difficulty');
  const tType = useTranslations('gamification.missionTypes');
  const ratio = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={difficulty}>{tDiff(difficulty)}</Badge>
          <Badge variant="outline">{tType(type)}</Badge>
          <span className="text-xs text-muted-foreground">+{points} pts</span>
        </div>
        <p className="font-semibold leading-tight">{name}</p>
        <div className="flex items-center gap-3">
          <Progress value={ratio} className="flex-1" />
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {current}/{target}
          </span>
        </div>
        {rewardName ? (
          <p className="text-xs text-muted-foreground">🎁 {rewardName}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
