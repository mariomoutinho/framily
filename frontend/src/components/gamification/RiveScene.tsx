/**
 * Wrapper preparado para Rive (animações ricas).
 *
 * Fase 1: apenas placeholder — recebe `src` mas não tenta carregar.
 * Fases futuras: integrar @rive-app/canvas para mascote, badges animados,
 * recompensas desbloqueadas, etc.
 */
interface RiveSceneProps {
  src: string;
  artboard?: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function RiveScene({ fallback, className }: RiveSceneProps) {
  return (
    <div
      className={`flex h-32 w-full items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground ${className ?? ''}`}
    >
      {fallback ?? '✨ Animação em breve'}
    </div>
  );
}
