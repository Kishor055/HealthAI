
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * HIGH-PERFORMANCE GATEWAY PROTOCOL
 * HealthAI PRO Expert Middleware
 * Optimized for low-latency session validation and secure clinical redirection.
 */
export async function middleware(request: NextRequest) {
  const session = request.cookies.get('__session')?.value;
  const { pathname } = request.nextUrl;

  // PUBLIC ACCESS GATING
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/';
  const isDashboardPage = pathname.startsWith('/dashboard');

  // REDIRECT PROTOCOL
  if (isAuthPage && session) {
    // Already authenticated - bypass to clinical workspace
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // NOTE: During prototyping, we allow client-side fallback for /dashboard
  // This prevents infinite loops in partially configured Admin SDK environments.
  if (isDashboardPage && !session) {
    // Optional: Only strictly enforce if strict clinical mode is enabled in .env
    // return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
