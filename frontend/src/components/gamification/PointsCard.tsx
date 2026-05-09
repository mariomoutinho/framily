'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatPoints } from '@/lib/utils';

interface PointsCardProps {
  points: number;
  delta?: number;
}

export function PointsCard({ points, delta = 0 }: PointsCardProps) {
  const t = useTranslations('gamification');

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
          <span>{t('points')}</span>
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <motion.div
          key={points}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="mt-2 text-3xl font-bold"
        >
          {formatPoints(points)}
        </motion.div>
        {delta > 0 ? (
          <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
            <TrendingUp className="h-3 w-3" />+{formatPoints(delta)}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
