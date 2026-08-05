import { NextResponse } from 'next/server';

export async function GET(request) {
  // Public status check (no auth required to query status)
  const authCookie = request.cookies.get('auth');
  const isAuthenticated = authCookie && authCookie.value === 'true';

  return NextResponse.json({ authenticated: isAuthenticated });
}
