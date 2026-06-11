
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware - Restored for Guest Access Protocol.
 * Guards /dashboard routes while allowing access to login, signup, and root.
 */
export async function middleware(request: NextRequest) {
  const session = request.cookies.get('__session')?.value;
  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect logged-in users away from auth pages
  if ((pathname === '/login' || pathname === '/signup') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
