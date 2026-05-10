import { useTranslations } from 'next-intl';
import { Check, Loader2, Pencil, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DifficultyKey } from '@/types';

interface TaskCardProps {
  title: string;
  difficulty: DifficultyKey;
  points: number;
  dueLabel?: string;
  frequencyLabel?: string;
  assigneeName?: string;
  completed?: boolean;
  completing?: boolean;
  onComplete?: () => void;
  onEdit?: () => void;
}

export function TaskCard({
  title,
  difficulty,
  points,
  dueLabel,
  frequencyLabel,
  assigneeName,
  completed = false,
  completing = false,
  onComplete,
  onEdit,
}: TaskCardProps) {
  const t = useTranslations('gamification.difficulty');
  const details = [assigneeName, dueLabel, frequencyLabel].filter(Boolean).join(' · ');

  return (
    <motion.div
      animate={completing ? { scale: 0.985 } : { scale: 1 }}
      transition={{ duration: 0.18 }}
    >
      <Card
        className={
          completed
            ? 'border-emerald-200 bg-emerald-50/70 shadow-sm'
            : completing
              ? 'border-primary/50 bg-primary/5 shadow-sm'
              : ''
        }
      >
        <CardContent className="flex items-center gap-3 p-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={difficulty}>{t(difficulty)}</Badge>
              <span className="text-xs font-medium text-primary">+{points} pts</span>
              {completed ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <Sparkles className="h-3 w-3" />
                  Concluida
                </span>
              ) : null}
            </div>
            <p className="truncate font-medium leading-tight">{title}</p>
            {details ? <p className="text-xs text-muted-foreground">{details}</p> : null}
          </div>
          {onEdit ? (
            <Button size="icon" variant="outline" onClick={onEdit} aria-label="Editar tarefa">
              <Pencil className="h-4 w-4" />
            </Button>
          ) : null}
          {onComplete ? (
            <Button
              size="icon"
              onClick={onComplete}
              disabled={completing}
              aria-label="Concluir tarefa"
            >
              {completing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
