import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DifficultyKey } from '@/types';

interface TaskCardProps {
  title: string;
  difficulty: DifficultyKey;
  points: number;
  dueLabel?: string;
  assigneeName?: string;
  onComplete?: () => void;
}

export function TaskCard({
  title,
  difficulty,
  points,
  dueLabel,
  assigneeName,
  onComplete,
}: TaskCardProps) {
  const t = useTranslations('gamification.difficulty');

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={difficulty}>{t(difficulty)}</Badge>
            <span className="text-xs text-muted-foreground">+{points} pts</span>
          </div>
          <p className="font-medium leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground">
            {assigneeName ? `${assigneeName} · ` : ''}
            {dueLabel ?? ''}
          </p>
        </div>
        {onComplete ? (
          <Button size="sm" onClick={onComplete}>
            ✓
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
