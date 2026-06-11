import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware - Resilient Gateway Protocol.
 * Updated to allow access during the prototype phase while server-side session sync is pending.
 */
export async function middleware(request: NextRequest) {
  const session = request.cookies.get('__session')?.value;
  const { pathname } = request.nextUrl;

  // Temporary Loosen Gating: During prototyping, we allow the layout and client-side hooks 
  // to handle auth logic if the session cookie is missing but we're in a stable state.
  // This prevents "Access Errors" on redirect loops.

  // Redirect logged-in users away from auth pages ONLY if session is verified
  if ((pathname === '/login' || pathname === '/signup') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
