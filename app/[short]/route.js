import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { findUrlByShort, logAccess, isUrlExpired, isBotUserAgent } from '@/app/lib/urls';

const DECAY_PROTECTION_BOTS = ['WhatsApp', 'Telegram', 'Slack', 'Discord', 'facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'SkypeUriPreview', 'Googlebot', 'bingbot', 'Slackbot', 'Facebot', 'ia_archiver', 'crawler', 'bot'];

function isDecayProtectionBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return DECAY_PROTECTION_BOTS.some(pattern => ua.includes(pattern.toLowerCase()));
}

function renderBurnedPage(short) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Confidential Link Destroyed</title></head><body><main><h1>🔥 Confidential Link Destroyed</h1><p>This link was configured to self-destruct after its first view and is no longer available.</p><p>The link record is retained for internal statistics only.</p><p>Short code: <code>${short}</code></p><p><a href="/">Return to URL Shortener</a></p></main></body></html>`;
  return new NextResponse(html, { status: 410, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function renderExpiredPage(entry) {
  return new NextResponse(`<h1>Link Expired</h1><p>Short code: <code>${entry.id}</code></p><p><a href="/">Return to URL Shortener</a></p>`, { status: 410, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function GET(request, { params }) {
  try {
    const { short } = params;
    if (!short) return NextResponse.redirect(new URL('/', request.url), 302);

    const entry = await findUrlByShort(short);
    if (!entry?.original) return renderBurnedPage(short);
    if (isUrlExpired(entry)) return renderExpiredPage(entry);

    const isDecay = !!entry.decay;
    if (isDecay && (entry.stats || []).length > 0) return renderBurnedPage(short);

    const requestHeaders = headers();
    const userAgent = requestHeaders.get('user-agent') || '';
    const isBot = isBotUserAgent(userAgent);
    if (isDecay && isDecayProtectionBot(userAgent)) return NextResponse.redirect(entry.original, 302);

    try {
      const ip = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || requestHeaders.get('x-real-ip') || requestHeaders.get('cf-connecting-ip') || 'unknown';
      const source = request.nextUrl.searchParams.get('source') || '';
      const requestData = {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(requestHeaders.entries()),
        ip,
        userAgent,
        referer: requestHeaders.get('referer') || '',
        source,
        nextUrl: JSON.stringify(request.nextUrl),
        cookies: JSON.stringify(request.cookies),
        geo: JSON.stringify(request.geo),
        requestIp: request.ip,
        host: requestHeaders.get('host'),
        protocol: requestHeaders.get('x-forwarded-proto'),
        pathname: requestHeaders.get('x-current-path'),
        request: JSON.stringify(request)
      };

      await logAccess(short, {
        timestamp: new Date().toISOString(),
        ip,
        userAgent,
        referer: requestData.referer,
        isBot,
        source,
        requestData,
      });
    } catch (error) {
      console.error('Failed to log access stats:', error);
    }

    return NextResponse.redirect(entry.original, 302);
  } catch (error) {
    console.error('Redirect error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
