import { NextResponse } from 'next/server';
import { isAllowedOrigin, createForbiddenResponse } from '@/app/lib/security';

export async function POST(request) {
  // Security: only allow same-domain calls
  if (!isAllowedOrigin(request)) {
    return createForbiddenResponse();
  }

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Basic hardcoded authentication as specified
    if (username === 'admin' && password === 'admin') {
      const response = NextResponse.json({ success: true, message: 'Login successful' });

      // Set httpOnly cookie for server-side auth checks (secure for production)
      response.cookies.set('auth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
