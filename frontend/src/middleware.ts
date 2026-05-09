import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? 'framily_session';

type SessionRole = 'owner' | 'admin' | 'adult' | 'child';
interface DecodedSession {
  token?: string;
  role?: SessionRole;
}

/**
 * Decode da sessão sem importar Buffer no Edge: usa atob.
 */
function decodeSession(value: string | undefined): DecodedSession | null {
  if (!value) return null;
  try {
    const padded = value + '='.repeat((4 - (value.length % 4)) % 4);
    const json = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as DecodedSession;
  } catch {
    return null;
  }
}

const PUBLIC_PATHS = ['/', '/login', '/register'];
const KIDS_PUBLIC_PATHS = ['/kids/login'];

function isPublic(path: string): boolean {
  if (PUBLIC_PATHS.includes(path)) return true;
  if (KIDS_PUBLIC_PATHS.includes(path)) return true;
  return false;
}

function isKidsPath(path: string): boolean {
  return path === '/kids' || path.startsWith('/kids/');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Não interferimos em rotas internas/_next/api
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  const role = session?.role;
  const isLoggedIn = !!session?.token && !!role;
  const isChild = role === 'child';

  // Público
  if (isPublic(pathname)) {
    // Se logado, redireciona pro dashboard correto
    if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL(isChild ? '/kids' : '/dashboard', request.url));
    }
    if (isLoggedIn && pathname === '/kids/login' && isChild) {
      return NextResponse.redirect(new URL('/kids', request.url));
    }
    return NextResponse.next();
  }

  // Privado: precisa de sessão
  if (!isLoggedIn) {
    const target = isKidsPath(pathname) ? '/kids/login' : '/login';
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Criança em rota adulta → redireciona para /kids
  if (isChild && !isKidsPath(pathname)) {
    return NextResponse.redirect(new URL('/kids', request.url));
  }

  // Adulto em rota infantil autenticada → redireciona para /dashboard
  if (!isChild && isKidsPath(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
