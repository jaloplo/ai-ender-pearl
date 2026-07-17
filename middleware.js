import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Check for auth cookie
  const authCookie = request.cookies.get('auth');

  const isAuthenticated = authCookie && authCookie.value === 'true';

  // Protect /list page and /api/urls endpoint
  if (pathname === '/list' || pathname.startsWith('/api/urls')) {
    if (!isAuthenticated) {
      // Redirect to login page
      const loginUrl = new URL('/login', request.url);
      // Preserve original destination for potential future use (optional)
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow access to login, shorten, redirect, etc.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/list',
    '/api/urls/:path*',
  ],
};
