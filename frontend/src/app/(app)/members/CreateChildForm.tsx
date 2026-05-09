'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/feedback/FormError';
import { postJson, type ApiErrorBody } from '@/lib/api/browser';

interface GuardianOption {
  id: number;
  name: string;
}

interface CreateChildFormProps {
  householdId: number;
  guardianOptions: GuardianOption[];
}

export function CreateChildForm({ householdId, guardianOptions }: CreateChildFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<ApiErrorBody['error']>();
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setError(undefined);
        setSuccess(null);

        startTransition(async () => {
          const result = await postJson(`/api/households/${householdId}/members/children`, {
            name: form.get('name'),
            nickname: form.get('nickname') || undefined,
            pin: form.get('pin') || undefined,
            guardian_user_id: Number(form.get('guardian_user_id')),
          });

          if (!result.ok) {
            setError(result.error);
            return;
          }

          (event.target as HTMLFormElement).reset();
          setSuccess('Criança adicionada!');
          router.refresh();
        });
      }}
    >
      <FormError error={error} />
      {success ? (
        <p className="rounded-md bg-emerald-50 p-2 text-xs text-emerald-700">{success}</p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="child-name">Nome</Label>
        <Input id="child-name" name="name" required maxLength={120} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="child-nickname">Apelido (opcional)</Label>
          <Input id="child-nickname" name="nickname" maxLength={30} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="child-pin">PIN (4–8 dígitos)</Label>
          <Input
            id="child-pin"
            name="pin"
            inputMode="numeric"
            pattern="[0-9]*"
            minLength={4}
            maxLength={8}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="guardian">Adulto responsável</Label>
        <select
          id="guardian"
          name="guardian_user_id"
          required
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {guardianOptions.length === 0 ? (
            <option value="">Nenhum adulto disponível</option>
          ) : (
            guardianOptions.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))
          )}
        </select>
      </div>

      <Button type="submit" className="w-full" disabled={isPending || guardianOptions.length === 0}>
        {isPending ? '…' : 'Adicionar criança'}
      </Button>
    </form>
  );
}
