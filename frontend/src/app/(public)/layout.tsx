import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}

function PublicHeader() {
  const t = useTranslations('common');
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold">{t('appName')}</span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            Entrar
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </header>
  );
}

function PublicFooter() {
  const t = useTranslations('common');
  return (
    <footer className="border-t py-6 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} {t('appName')}
    </footer>
  );
}
