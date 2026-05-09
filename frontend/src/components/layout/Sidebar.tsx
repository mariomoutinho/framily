'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  ListChecks,
  Target,
  Trophy,
  Gift,
  Award,
  CalendarDays,
  Bell,
  Wallet,
  ShoppingCart,
  Users,
  Settings,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { href: '/tasks', icon: ListChecks, key: 'tasks' },
  { href: '/missions', icon: Target, key: 'missions' },
  { href: '/ranking', icon: Trophy, key: 'ranking' },
  { href: '/rewards', icon: Gift, key: 'rewards' },
  { href: '/achievements', icon: Award, key: 'achievements' },
  { href: '/calendar', icon: CalendarDays, key: 'calendar' },
  { href: '/reminders', icon: Bell, key: 'reminders' },
  { href: '/bills', icon: Wallet, key: 'bills' },
  { href: '/shopping', icon: ShoppingCart, key: 'shopping' },
  { href: '/members', icon: Users, key: 'members' },
  { href: '/settings', icon: Settings, key: 'settings' },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="text-lg font-bold">{tCommon('appName')}</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, icon: Icon, key }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {t(key)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <Link
          href="/kids"
          className="flex items-center gap-3 rounded-md bg-gradient-kids px-3 py-2 text-sm font-medium text-kids-foreground shadow-sm hover:opacity-95"
        >
          <Sparkles className="h-4 w-4" />
          {t('kidsArea')}
        </Link>
      </div>
    </aside>
  );
}
