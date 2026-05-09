import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

/**
 * Layout autenticado adulto.
 *
 * Fase 1: estrutura visual sem proteção de rota efetiva.
 * Fase 2: ler cookie de sessão; se ausente, redirecionar para /login.
 * Se token tiver ability 'child', redirecionar para /kids.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="mx-auto max-w-6xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
