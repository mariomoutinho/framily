'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/feedback/FormError';
import { postJson, type ApiErrorBody } from '@/lib/api/browser';

export function RegisterForm() {
  const t = useTranslations('auth');
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
          const result = await postJson('/api/auth/register', {
            name: form.get('name'),
            email: form.get('email'),
            password: form.get('password'),
            password_confirmation: form.get('password_confirmation'),
          });

          if (!result.ok) {
            setError(result.error);
            return;
          }

          router.replace('/onboarding');
          router.refresh();
        });
      }}
    >
      <FormError error={error} />

      <div className="space-y-2">
        <Label htmlFor="name">{t('name')}</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t('password')}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password_confirmation">{t('passwordConfirmation')}</Label>
        <Input
          id="password_confirmation"
          name="password_confirmation"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? '…' : t('submitRegister')}
      </Button>
    </form>
  );
}
