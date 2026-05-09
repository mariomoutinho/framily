import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';

interface RewardCardProps {
  name: string;
  description?: string;
  pointsCost: number;
  unlocked: boolean;
  onRedeem?: () => void;
}

export function RewardCard({
  name,
  description,
  pointsCost,
  unlocked,
  onRedeem,
}: RewardCardProps) {
  return (
    <Card className={unlocked ? 'border-primary/30' : 'opacity-75'}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Gift className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold leading-tight">{name}</p>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium tabular-nums">
            {pointsCost} pts
          </span>
        </div>
        <Button
          size="sm"
          variant={unlocked ? 'default' : 'outline'}
          className="w-full"
          disabled={!unlocked}
          onClick={onRedeem}
        >
          {unlocked ? 'Resgatar' : 'Bloqueado'}
        </Button>
      </CardContent>
    </Card>
  );
}
