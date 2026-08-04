import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { findUrlByShort, logAccess, isUrlExpired } from '@/app/lib/urls';

export async function GET(request, { params }) {
  try {
    const { short } = params;

    if (!short) {
      return NextResponse.json({ error: 'Short code required' }, { status: 400 });
    }

    const entry = await findUrlByShort(short);

    if (entry && entry.original) {
      // Check for expiration BEFORE logging or redirecting
      if (isUrlExpired(entry)) {
        // Return a clear expired status page (retro intranet style)
        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Link Expired</title>
  <style>
    body { font-family: system-ui, Arial, sans-serif; background: #fff; color: #151515; margin: 0; padding: 40px 20px; line-height: 1.5; }
    .container { max-width: 620px; margin: 0 auto; background: #f9f9f9; border: 1px solid #e5e5e5; padding: 32px; border-radius: 4px; }
    h1 { font-family: Georgia, serif; font-size: 28px; margin: 0 0 16px; color: #151515; }
    .status { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px 16px; margin: 16px 0; font-size: 15px; }
    .meta { font-size: 13px; color: #666; margin-top: 16px; }
    a { color: #66cd7a; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Link Expired</h1>
    <div class="status">
      This shortened link has expired or reached its usage limit and is no longer active.
    </div>
    <p>The original destination is no longer accessible via this short URL.</p>
    <div class="meta">
      Short code: <code>${entry.id}</code><br>
      ${entry.expiresAt ? `Expired on: ${new Date(entry.expiresAt).toLocaleString()}<br>` : ''}
      ${entry.maxClicks != null ? `Max clicks reached: ${entry.maxClicks}<br>` : ''}
      Created: ${new Date(entry.created).toLocaleString()}
    </div>
    <p style="margin-top: 24px;"><a href="/">Return to URL Shortener</a></p>
  </div>
</body>
</html>`;
        return new NextResponse(html, {
          status: 410, // Gone
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

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
