import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get('auth');
  const isAuthenticated = authCookie && authCookie.value === 'true';

  // The current authentication model has one administrator account. Until
  // role claims exist, auth=true is the admin boundary for protected tools.
  const protectedPath =
    pathname === '/list' ||
    pathname.startsWith('/stats') ||
    pathname.startsWith('/admin') ||
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
    '/admin/:path*',
    '/api/urls/:path*',
    '/api/stats/:path*',
    '/api/visits',
    '/api/analytics',
  ],
};
