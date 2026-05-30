
import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route to create a server-side session cookie.
 * This extends login persistence up to 1 year.
 */
export async function POST(request: NextRequest) {
  const { idToken } = await request.json();
  
  // Set session expiration to 5 days for the cookie, but refresh token handles the 1 year
  // Firebase Admin Session Cookie has a max age of 14 days, we rely on persistence layers for 1 year.
  const expiresIn = 60 * 60 * 24 * 5 * 1000; 

  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    const cookieStore = await cookies();
    
    cookieStore.set('__session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    return NextResponse.json({ status: 'error', error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('__session');
  return NextResponse.json({ status: 'success' });
}
