import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Target, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const t = useTranslations('landing');

  return (
    <div className="space-y-10 text-center">
      <section className="space-y-4">
        <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
          {t('hero.title')}
        </h1>
        <p className="mx-auto max-w-prose text-pretty text-muted-foreground">
          {t('hero.subtitle')}
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button asChild size="lg">
            <Link href="/register">{t('hero.ctaPrimary')}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">{t('hero.ctaSecondary')}</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-3 text-left sm:grid-cols-3">
        <FeatureCard icon={Trophy} title={t('features.progressTitle')} body={t('features.progressBody')} />
        <FeatureCard icon={Target} title={t('features.missionsTitle')} body={t('features.missionsBody')} />
        <FeatureCard icon={Sparkles} title={t('features.kidsTitle')} body={t('features.kidsBody')} />
      </section>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-2 p-5">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
