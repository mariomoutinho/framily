import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Estado vazio padrão usado nas telas placeholder da Fase 1.
 * Substituído por dados reais nas Fases 2-5.
 */
export function PlaceholderState({ messageKey }: { messageKey?: string }) {
  const t = useTranslations('common');
  const tEmpty = useTranslations('empty');

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        <Sparkles className="h-8 w-8 text-primary/60" />
        <p className="text-sm text-muted-foreground">
          {messageKey ? tEmpty(messageKey) : t('phasePlaceholder')}
        </p>
        <p className="text-xs uppercase tracking-wider text-muted-foreground/70">
          {t('soon')}
        </p>
      </CardContent>
    </Card>
  );
}
