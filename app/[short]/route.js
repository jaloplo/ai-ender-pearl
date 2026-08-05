import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { findUrlByShort, logAccess, isUrlExpired, deleteShortUrl } from '@/app/lib/urls';

// List of common crawler / link preview User-Agents to protect decay links from accidental burn
const CRAWLER_USER_AGENTS = [
  'WhatsApp',
  'Telegram',
  'Slack',
  'Discord',
  'facebookexternalhit',
  'Twitterbot',
  'LinkedInBot',
  'SkypeUriPreview',
  'Googlebot',
  'bingbot',
  'Slackbot',
  'facebookexternalhit/1.1',
  'Facebot',
  'ia_archiver',
  'crawler',
  'bot',
];

function isCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some(crawler => ua.includes(crawler.toLowerCase()));
}

function renderBurnedPage(short, entry = null) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Confidential Link Destroyed</title>
  <style>
    body { font-family: system-ui, Arial, sans-serif; background: #fff; color: #151515; margin: 0; padding: 40px 20px; line-height: 1.5; }
    .container { max-width: 620px; margin: 0 auto; background: #f9f9f9; border: 1px solid #e5e5e5; padding: 32px; border-radius: 4px; }
    h1 { font-family: Georgia, serif; font-size: 28px; margin: 0 0 16px; color: #991b1b; }
    .status { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px 16px; margin: 16px 0; font-size: 15px; }
    .meta { font-size: 13px; color: #666; margin-top: 16px; }
    a { color: #66cd7a; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .flame { font-size: 32px; margin-bottom: 8px; display: block; }
  </style>
</head>
<body>
  <div class="container">
    <span class="flame">🔥</span>
    <h1>Confidential Link Destroyed</h1>
    <div class="status">
      This link was configured to self-destruct after its first view and is no longer available.
    </div>
    <p>The original destination can no longer be reached via this short URL. It has been permanently erased from the server.</p>
    <div class="meta">
      Short code: <code>${short}</code><br>
      ${entry && entry.created ? `Originally created: ${new Date(entry.created).toLocaleString()}<br>` : ''}
      This was a single-use (Decay / Burn After Reading) link.
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

function renderExpiredPage(entry) {
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
        return renderExpiredPage(entry);
      }

      const isDecay = !!entry.decay;
      const accessCount = (entry.stats || []).length;
      const hasBeenAccessed = accessCount > 0;

      // For decay links that have already been used: show destroyed page
      if (isDecay && hasBeenAccessed) {
        return renderBurnedPage(short, entry);
      }

      const headersList = headers();
      const userAgent = headersList.get('user-agent') || '';
      const isBot = isCrawler(userAgent);

      // For decay links: if crawler/bot preview detected, redirect WITHOUT logging/burning
      // This protects the link from being consumed by link previews (WhatsApp, Telegram, etc.)
      if (isDecay && isBot) {
        return NextResponse.redirect(entry.original, 302);
      }

      // Log access statistics before redirect (for all links, including decay first use)
      try {
        const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                  headersList.get('x-real-ip') ||
                  headersList.get('cf-connecting-ip') ||
                  'unknown';
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

      // If this was a decay link (first human access), immediately delete/burn it after logging
      if (isDecay) {
        try {
          await deleteShortUrl(short);
        } catch (delErr) {
          console.error('Failed to burn/decay short URL after access:', delErr);
        }
      }

      // Perform 302 redirect to the original URL
      return NextResponse.redirect(entry.original, 302);
    }

    // If not found (e.g. already burned decay link or invalid), render the dedicated destroyed status page
    // (avoids generic 404 for burned single-use links per spec)
    return renderBurnedPage(short);
  } catch (error) {
    console.error('Redirect error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
