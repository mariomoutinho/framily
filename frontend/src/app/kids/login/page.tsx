'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/feedback/FormError';
import { postJson, type ApiErrorBody } from '@/lib/api/browser';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

type Mode = 'nickname' | 'email';

export default function KidsLoginPage() {
  const t = useTranslations('kids');
  const tAuth = useTranslations('auth');
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('nickname');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<ApiErrorBody['error']>();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(undefined);

    startTransition(async () => {
      const path =
        mode === 'nickname' ? '/api/kids/auth/login-pin' : '/api/kids/auth/login-email';

      const body =
        mode === 'nickname'
          ? {
              household_code: String(form.get('household_code') ?? '').toUpperCase(),
              nickname: form.get('nickname'),
              pin: form.get('pin'),
            }
          : {
              email: form.get('email'),
              password: form.get('password'),
            };

      const result = await postJson(path, body);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.replace('/kids');
      router.refresh();
    });
  };

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center p-4">
      <div className="mb-6 flex items-center justify-center gap-2 text-amber-700">
        <Sparkles className="h-6 w-6" />
        <span className="text-lg font-bold">Framily Kids</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('loginTitle')}</CardTitle>
          <CardDescription>{t('loginSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            <ModeButton active={mode === 'nickname'} onClick={() => setMode('nickname')}>
              {t('modeNickname')}
            </ModeButton>
            <ModeButton active={mode === 'email'} onClick={() => setMode('email')}>
              {t('modeEmail')}
            </ModeButton>
          </div>

          <FormError error={error} />

          {mode === 'nickname' ? (
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="household_code">{t('householdCode')}</Label>
                <Input
                  id="household_code"
                  name="household_code"
                  placeholder="ABCD1234"
                  className="uppercase"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">{t('nickname')}</Label>
                <Input id="nickname" name="nickname" autoComplete="username" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">{t('pin')}</Label>
                <Input
                  id="pin"
                  name="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  minLength={4}
                  maxLength={8}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" variant="kids" className="w-full" disabled={isPending}>
                {isPending ? '…' : t('submit')}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="email">{tAuth('email')}</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{tAuth('password')}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" variant="kids" className="w-full" disabled={isPending}>
                {isPending ? '…' : t('submit')}
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-muted-foreground">
            <Link href="/login" className="hover:underline">
              Sou adulto · ir para o login da família
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
