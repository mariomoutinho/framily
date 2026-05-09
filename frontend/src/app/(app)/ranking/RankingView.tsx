'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Trophy, Medal, Award } from 'lucide-react';
import type { RankingEntry } from '@/types';

interface RankingViewProps {
  scope: 'week' | 'month' | 'all';
  entries: RankingEntry[];
}

const PODIUM_ICONS = [Trophy, Medal, Award];

export function RankingView({ scope, entries }: RankingViewProps) {
  const t = useTranslations('ranking');
  const top = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <>
      <nav className="flex gap-2">
        {(['week', 'month', 'all'] as const).map((s) => (
          <Link
            key={s}
            href={`/ranking?scope=${s}`}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm transition-colors',
              s === scope
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-input text-muted-foreground hover:bg-accent',
            )}
          >
            {t(`scope${s.charAt(0).toUpperCase()}${s.slice(1)}` as 'scopeWeek' | 'scopeMonth' | 'scopeAll')}
          </Link>
        ))}
      </nav>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {t('empty')}
          </CardContent>
        </Card>
      ) : (
        <>
          {top.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('podiumTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  {top.map((entry, i) => {
                    const Icon = PODIUM_ICONS[i];
                    return (
                      <div
                        key={entry.user_id}
                        className={cn(
                          'rounded-xl border p-4 text-center',
                          i === 0
                            ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100'
                            : i === 1
                              ? 'border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100'
                              : 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100',
                        )}
                      >
                        <Icon
                          className={cn(
                            'mx-auto h-7 w-7',
                            i === 0
                              ? 'text-amber-600'
                              : i === 1
                                ? 'text-slate-500'
                                : 'text-orange-600',
                          )}
                        />
                        <p className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {entry.position}º lugar
                        </p>
                        <p className="text-base font-semibold">{entry.name}</p>
                        <p className="text-2xl font-bold tabular-nums">{entry.points}</p>
                        <p className="text-xs text-muted-foreground">pts</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {rest.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('tableTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {rest.map((entry) => (
                    <li
                      key={entry.user_id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <span className="w-6 text-center text-sm font-semibold tabular-nums text-muted-foreground">
                        {entry.position}º
                      </span>
                      <span className="flex-1 text-sm">{entry.name}</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {entry.points} pts
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </>
  );
}
