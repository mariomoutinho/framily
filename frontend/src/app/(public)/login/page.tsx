import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  const t = useTranslations('auth');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t('loginTitle')}</CardTitle>
        <CardDescription>{t('loginSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('noAccount')}{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            {t('registerCta')}
          </Link>
        </p>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          <Link href="/kids/login" className="hover:underline">
            Sou criança · entrar na minha área
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
