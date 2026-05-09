/**
 * Wrapper raiz da área infantil — define apenas o tom de fundo.
 * O chrome autenticado (topbar com links de navegação) fica em
 * /kids/(authenticated)/layout.tsx, para não aparecer em /kids/login.
 */
export default function KidsLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-amber-50/50">{children}</div>;
}
