import { useTranslations } from 'next-intl';
import { Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface LevelCardProps {
  level: number;
  progress: number; // 0-100
}

export function LevelCard({ level, progress }: LevelCardProps) {
  const t = useTranslations('gamification');

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
          <span>{t('level')}</span>
          <Award className="h-4 w-4 text-primary" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold">{level}</span>
        </div>
        <Progress value={progress} className="mt-3" />
      </CardContent>
    </Card>
  );
}
