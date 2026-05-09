'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/feedback/FormError';
import { postJson, type ApiErrorBody } from '@/lib/api/browser';

interface OnboardingFormProps {
  mode: 'create' | 'join';
}

export function OnboardingForm({ mode }: OnboardingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<ApiErrorBody['error']>();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setError(undefined);

        startTransition(async () => {
          const result =
            mode === 'create'
              ? await postJson('/api/households', { name: form.get('name') })
              : await postJson('/api/households/join', {
                  code: String(form.get('code') ?? '').toUpperCase(),
                });

          if (!result.ok) {
            setError(result.error);
            return;
          }

          router.replace('/dashboard');
          router.refresh();
        });
      }}
    >
      <FormError error={error} />

      {mode === 'create' ? (
        <div className="space-y-2">
          <Label htmlFor="name">Nome da casa</Label>
          <Input id="name" name="name" placeholder="Casa Silva" required maxLength={120} />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="code">Código</Label>
          <Input
            id="code"
            name="code"
            placeholder="ABCD1234"
            className="uppercase"
            required
            maxLength={16}
          />
        </div>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? '…' : mode === 'create' ? 'Criar casa' : 'Entrar na casa'}
      </Button>
    </form>
  );
}
