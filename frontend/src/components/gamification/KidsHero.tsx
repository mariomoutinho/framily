'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';

interface KidsHeroProps {
  childName?: string;
}

export function KidsHero({ childName }: KidsHeroProps) {
  const t = useTranslations('kids');

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-kids p-6 text-kids-foreground shadow-md"
    >
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6" />
        <h1 className="text-2xl font-bold">
          {childName ? `${t('dashboardTitle').replace('Olá!', `Olá, ${childName}!`)}` : t('dashboardTitle')}
        </h1>
      </div>
    </motion.section>
  );
}
