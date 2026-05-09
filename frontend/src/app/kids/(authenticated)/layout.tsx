import { KidsTopBar } from '@/components/layout/KidsTopBar';

/**
 * Layout das telas autenticadas da área infantil.
 *
 * Fase 1: apenas o chrome visual.
 * Fase 2: validar cookie httpOnly + ability 'child'; se ausente, redirect /kids/login.
 */
export default function KidsAuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <KidsTopBar />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </>
  );
}
