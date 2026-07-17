import { NextResponse } from 'next/server';
import { findUrlByShort, logAccess } from '@/app/lib/urls';

export async function GET(request, { params }) {
  const { short } = params;

  if (!short) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const entry = await findUrlByShort(short);

  if (entry && entry.original) {
    // Log access statistics before redirect
    try {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                 request.headers.get('x-real-ip') ||
                 request.headers.get('cf-connecting-ip') ||
                 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const referer = request.headers.get('referer') || '';
      const timestamp = new Date().toISOString();

      await logAccess(short, {
        timestamp,
        ip,
        userAgent,
        referer,
      });
    } catch (logErr) {
      console.error('Failed to log access stats (API redirect):', logErr);
    }

    // 302 redirect (temporary) to original URL
    return NextResponse.redirect(entry.original, 302);
  }

  // Not found - redirect to home
  return NextResponse.redirect(new URL('/?error=notfound', request.url));
}
