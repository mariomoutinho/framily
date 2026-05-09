'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/feedback/FormError';
import { postJson, type ApiErrorBody } from '@/lib/api/browser';

interface InviteResponse {
  data: {
    code: string;
    role: string;
    expires_at: string | null;
  };
}

export function CreateInviteForm({ householdId }: { householdId: number }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<ApiErrorBody['error']>();
  const [code, setCode] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setError(undefined);
        setCode(null);

        startTransition(async () => {
          const result = await postJson<InviteResponse>(
            `/api/households/${householdId}/invites`,
            {
              role: form.get('role'),
              email: form.get('email') || undefined,
            },
          );

          if (!result.ok) {
            setError(result.error);
            return;
          }

          setCode(result.data.data.code);
        });
      }}
    >
      <FormError error={error} />
      {code ? (
        <p className="rounded-md bg-primary/10 p-2 text-sm font-mono text-primary">
          Código: <strong>{code}</strong>
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="invite-role">Papel</Label>
          <select
            id="invite-role"
            name="role"
            defaultValue="adult"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="adult">Adulto</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-email">E-mail (opcional)</Label>
          <Input id="invite-email" name="email" type="email" />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending} variant="secondary">
        {isPending ? '…' : 'Gerar código'}
      </Button>
    </form>
  );
}
