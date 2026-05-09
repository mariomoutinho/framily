'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';

interface LogoutButtonProps extends Omit<ButtonProps, 'onClick'> {
  redirectTo?: string;
}

export function LogoutButton({
  redirectTo = '/login',
  variant = 'ghost',
  size = 'sm',
  ...rest
}: LogoutButtonProps) {
  const t = useTranslations('nav');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant={variant}
      size={size}
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'same-origin',
          });
          router.replace(redirectTo);
          router.refresh();
        });
      }}
      {...rest}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {t('logout')}
    </Button>
  );
}
