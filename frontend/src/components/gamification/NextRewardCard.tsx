import { useTranslations } from 'next-intl';
import { Gift } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface NextRewardCardProps {
  rewardName: string;
  pointsToGo: number;
}

export function NextRewardCard({ rewardName, pointsToGo }: NextRewardCardProps) {
  const t = useTranslations('gamification');

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-5">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
          <span>{t('weekProgress')}</span>
          <Gift className="h-4 w-4 text-primary" />
        </div>
        <div className="mt-2 text-sm font-semibold">{rewardName}</div>
        <div className="text-xs text-muted-foreground">
          {t('nextRewardIn', { points: pointsToGo, reward: rewardName })}
        </div>
      </CardContent>
    </Card>
  );
}
