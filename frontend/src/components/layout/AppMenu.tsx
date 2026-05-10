'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  CalendarDays,
  Gift,
  Home,
  LayoutDashboard,
  ListChecks,
  Menu,
  Settings,
  ShoppingCart,
  Target,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  // Rota futura para a visão da casa. Mantém o item seguro sem quebrar a navegação atual.
  { href: '#', icon: Home, key: 'myHouse' },
  { href: '/members', icon: Users, key: 'members' },
  { href: '/tasks', icon: ListChecks, key: 'tasks' },
  { href: '/missions', icon: Target, key: 'missions' },
  { href: '/rewards', icon: Gift, key: 'rewards' },
  { href: '/calendar', icon: CalendarDays, key: 'calendar' },
  { href: '/shopping', icon: ShoppingCart, key: 'shopping' },
  { href: '/bills', icon: Wallet, key: 'bills' },
  { href: '/settings', icon: Settings, key: 'settings' },
] as const;

export function AppMenu() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          aria-label="Abrir menu principal"
          variant="ghost"
          size="icon"
          className="-ml-2 h-10 w-10 text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="flex w-[20rem] max-w-[85vw] flex-col p-0">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle>{tCommon('appName')}</SheetTitle>
          <SheetDescription>Casa atual</SheetDescription>
        </SheetHeader>

        <nav className="flex-1 space-y-1 p-3" aria-label="Menu principal">
          {menuItems.map(({ href, icon: Icon, key }) => {
            const active = href !== '#' && (pathname === href || pathname.startsWith(`${href}/`));

            return (
              <SheetClose asChild key={key}>
                <Link
                  href={href}
                  className={cn(
                    'flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    active
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{t(key)}</span>
                </Link>
              </SheetClose>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
