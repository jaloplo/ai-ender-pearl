import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { findUrlByShort, logAccess } from '@/app/lib/urls';

export async function GET(request, { params }) {
  try {
    const { short } = params;

    if (!short) {
      return NextResponse.json({ error: 'Short code required' }, { status: 400 });
    }

    const entry = await findUrlByShort(short);

    if (entry && entry.original) {
      // Log access statistics before redirect
      try {
        const headersList = headers();
        const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                  headersList.get('x-real-ip') ||
                  headersList.get('cf-connecting-ip') ||
                  'unknown';
        const userAgent = headersList.get('user-agent') || 'unknown';
        const referer = headersList.get('referer') || '';
        const timestamp = new Date().toISOString();

        await logAccess(short, {
          timestamp,
          ip,
          userAgent,
          referer,
        });
      } catch (logErr) {
        // Do not block redirect on logging failure
        console.error('Failed to log access stats:', logErr);
      }

      // Perform 302 redirect to the original URL
      return NextResponse.redirect(entry.original, 302);
    }

    // If not found, redirect to home with error hint (or could show 404)
    return new NextResponse('Short URL not found', { status: 404 });
  } catch (error) {
    console.error('Redirect error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
