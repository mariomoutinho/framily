import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BadgeCardProps {
  name: string;
  description?: string;
  unlocked: boolean;
}

export function BadgeCard({ name, description, unlocked }: BadgeCardProps) {
  return (
    <Card className={cn('text-center', !unlocked && 'opacity-50')}>
      <CardContent className="flex flex-col items-center gap-2 p-4">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full',
            unlocked ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground',
          )}
        >
          <Trophy className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold leading-tight">{name}</p>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
