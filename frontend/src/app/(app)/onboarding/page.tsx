import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingForm } from './OnboardingForm';

/**
 * Onboarding pós-cadastro: criar a primeira casa OU entrar em uma casa
 * existente via código.
 */
export default function OnboardingPage() {
  const t = useTranslations('common');

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vamos criar sua família?</h1>
        <p className="text-sm text-muted-foreground">{t('tagline')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criar nova casa</CardTitle>
          <CardDescription>Você será o owner e poderá convidar todos os membros.</CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm mode="create" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entrar com código</CardTitle>
          <CardDescription>
            Recebeu um código de convite? Cole abaixo para entrar na casa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm mode="join" />
        </CardContent>
      </Card>
    </div>
  );
}
