import { useTranslations } from 'next-intl';
import { CalendarRange } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface WeeklyProgressCardProps {
  goal: number;
  achieved: number;
}

export function WeeklyProgressCard({ goal, achieved }: WeeklyProgressCardProps) {
  const t = useTranslations('gamification');
  const ratio = goal > 0 ? Math.min(100, Math.round((achieved / goal) * 100)) : 0;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
          <span>{t('weekProgress')}</span>
          <CalendarRange className="h-4 w-4 text-primary" />
        </div>
        <div className="mt-2 text-3xl font-bold">
          {achieved}
          <span className="ml-1 text-base font-medium text-muted-foreground">/ {goal}</span>
        </div>
        <Progress value={ratio} className="mt-3" />
      </CardContent>
    </Card>
  );
}
