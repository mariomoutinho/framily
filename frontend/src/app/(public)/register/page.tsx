import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RegisterForm } from './RegisterForm';

export default function RegisterPage() {
  const t = useTranslations('auth');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t('registerTitle')}</CardTitle>
        <CardDescription>{t('registerSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('haveAccount')}{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t('loginCta')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
