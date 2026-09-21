import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get('auth');
  const isAuthenticated = authCookie && authCookie.value === 'true';

  // Protect list/stats pages and their data endpoints, including analytics.
  const protectedPath =
    pathname === '/list' ||
    pathname.startsWith('/stats') ||
    pathname.startsWith('/api/urls') ||
    pathname.startsWith('/api/stats') ||
    pathname === '/api/visits' ||
    pathname === '/api/analytics';

  if (protectedPath && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/list',
    '/stats/:path*',
    '/api/urls/:path*',
    '/api/stats/:path*',
    '/api/visits',
    '/api/analytics',
  ],
};
