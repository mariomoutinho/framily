'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Sparkles, Home, ListChecks, Target, Gift, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoutButton } from '@/components/auth/LogoutButton';

const items = [
  { href: '/kids', icon: Home, key: 'dashboard' },
  { href: '/kids/tasks', icon: ListChecks, key: 'tasks' },
  { href: '/kids/missions', icon: Target, key: 'missions' },
  { href: '/kids/rewards', icon: Gift, key: 'rewards' },
  { href: '/kids/achievements', icon: Trophy, key: 'ranking' },
] as const;

export function KidsTopBar() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <header className="sticky top-0 z-10 border-b border-white/20 bg-gradient-kids text-kids-foreground shadow-md">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
        <div className="flex items-center gap-2 font-bold">
          <Sparkles className="h-5 w-5" />
          <span>Framily Kids</span>
        </div>
        <nav className="ml-auto flex items-center gap-1">
          {items.map(({ href, icon: Icon, key }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-white/25'
                    : 'text-white/85 hover:bg-white/15',
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t(key)}</span>
              </Link>
            );
          })}
          <div className="ml-2 hidden sm:block">
            <LogoutButton
              redirectTo="/kids/login"
              variant="ghost"
              size="sm"
              className="text-white/85 hover:bg-white/15 hover:text-white"
            />
          </div>
        </nav>
      </div>
    </header>
  );
}
