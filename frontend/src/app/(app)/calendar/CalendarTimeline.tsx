import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ListChecks, Target, Bell, Wallet } from 'lucide-react';
import type { CalendarEvent } from '@/types';

interface CalendarTimelineProps {
  events: CalendarEvent[];
}

const ICON_MAP = {
  task: ListChecks,
  mission: Target,
  reminder: Bell,
  bill: Wallet,
} as const;

const TYPE_LABEL = {
  task: 'Tarefa',
  mission: 'Missão',
  reminder: 'Lembrete',
  bill: 'Conta',
} as const;

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function CalendarTimeline({ events }: CalendarTimelineProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Nenhum evento nos próximos 30 dias.
        </CardContent>
      </Card>
    );
  }

  // Agrupa por dia
  const byDay = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    const day = event.date.slice(0, 10);
    (acc[day] ??= []).push(event);
    return acc;
  }, {});

  const days = Object.keys(byDay).sort();

  return (
    <div className="space-y-4">
      {days.map((day) => (
        <Card key={day}>
          <CardContent className="p-0">
            <div className="border-b bg-muted/40 px-4 py-2">
              <p className="text-sm font-semibold">
                {new Date(day).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
            <ul className="divide-y">
              {byDay[day].map((event) => {
                const Icon = ICON_MAP[event.type];
                const time = new Date(event.date).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <li
                    key={`${event.type}-${event.id}`}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {time} · {TYPE_LABEL[event.type]}
                        {event.type === 'bill' && typeof event.meta?.amount === 'number'
                          ? ` · ${BRL.format(event.meta.amount as number)}`
                          : ''}
                      </p>
                    </div>
                    <Badge variant="outline">{event.status}</Badge>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
