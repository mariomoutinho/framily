'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/feedback/FormError';
import { Bell, Trash2 } from 'lucide-react';
import { postJson, type ApiErrorBody } from '@/lib/api/browser';
import type { Reminder } from '@/types';

interface RemindersBoardProps {
  householdId: number;
  reminders: Reminder[];
}

export function RemindersBoard({ householdId, reminders }: RemindersBoardProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setCreating((v) => !v)}>
          {creating ? 'Cancelar' : 'Novo lembrete'}
        </Button>
      </div>

      {creating ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Novo lembrete</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateReminderForm
              householdId={householdId}
              onCreated={() => {
                setCreating(false);
                router.refresh();
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      {reminders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Nenhum lembrete agendado.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {reminders.map((reminder) => (
                <ReminderRow
                  key={reminder.id}
                  reminder={reminder}
                  householdId={householdId}
                  onDeleted={() => router.refresh()}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function ReminderRow({
  reminder,
  householdId,
  onDeleted,
}: {
  reminder: Reminder;
  householdId: number;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const date = new Date(reminder.remind_at);

  return (
    <li className="flex items-center gap-3 p-4">
      <Bell className="h-4 w-4 text-primary" />
      <div className="flex-1">
        <p className="font-medium">{reminder.title}</p>
        {reminder.body ? (
          <p className="text-xs text-muted-foreground">{reminder.body}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {date.toLocaleString('pt-BR')}
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await fetch(`/api/households/${householdId}/reminders/${reminder.id}`, {
              method: 'DELETE',
              credentials: 'same-origin',
            });
            onDeleted();
          })
        }
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}

function CreateReminderForm({
  householdId,
  onCreated,
}: {
  householdId: number;
  onCreated: () => void;
}) {
  const [error, setError] = useState<ApiErrorBody['error']>();
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setError(undefined);
        startTransition(async () => {
          const result = await postJson(`/api/households/${householdId}/reminders`, {
            title: form.get('title'),
            body: form.get('body') || undefined,
            remind_at: form.get('remind_at'),
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          (event.target as HTMLFormElement).reset();
          onCreated();
        });
      }}
    >
      <FormError error={error} />

      <div className="space-y-1.5">
        <Label htmlFor="rem-title">Título</Label>
        <Input id="rem-title" name="title" required maxLength={200} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rem-body">Detalhes (opcional)</Label>
        <Input id="rem-body" name="body" maxLength={2000} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rem-when">Quando</Label>
        <Input id="rem-when" name="remind_at" type="datetime-local" required />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? '…' : 'Agendar'}
      </Button>
    </form>
  );
}
