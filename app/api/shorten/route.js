import { NextResponse } from 'next/server';
import { addShortUrl } from '@/app/lib/urls';
import { isAllowedOrigin, createForbiddenResponse } from '@/app/lib/security';

// Helper to fetch page title from original URL (server-side, best effort)
async function getPageTitle(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'URLShortener/1.0 (+https://intranetfromthetrenches.substack.com)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    // Extract <title> content (simple regex, handles most cases)
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (match && match[1]) {
      return match[1].trim().substring(0, 200); // cap length
    }
    return null;
  } catch (e) {
    // Network error, timeout, or non-HTML: silently ignore
    return null;
  }
}

export async function POST(request) {
  // Security: only allow same-domain calls
  if (!isAllowedOrigin(request)) {
    return createForbiddenResponse();
  }

  try {
    const { 
      url, 
      private: isPrivate = false, 
      customSlug = null,
      expiresAt = null,
      maxClicks = null 
    } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    
    // Basic URL validation
    let validUrl;
    try {
      validUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Validate expiration fields if provided
    let normalizedExpiresAt = null;
    if (expiresAt) {
      const expDate = new Date(expiresAt);
      if (isNaN(expDate.getTime())) {
        return NextResponse.json({ error: 'Invalid expiration date format' }, { status: 400 });
      }
      if (expDate <= new Date()) {
        return NextResponse.json({ error: 'Expiration date must be in the future' }, { status: 400 });
      }
      normalizedExpiresAt = expDate.toISOString();
    }

    let normalizedMaxClicks = null;
    if (maxClicks != null && maxClicks !== '') {
      const clicks = parseInt(maxClicks, 10);
      if (isNaN(clicks) || clicks < 1) {
        return NextResponse.json({ error: 'Max clicks must be a positive integer' }, { status: 400 });
      }
      normalizedMaxClicks = clicks;
    }
    
    // Fetch title (non-blocking for UX, best effort)
    const title = await getPageTitle(validUrl.toString());
    
    const entry = await addShortUrl(
      validUrl.toString(), 
      !!isPrivate, 
      title, 
      customSlug || null,
      normalizedExpiresAt,
      normalizedMaxClicks
    );
    
    const shortUrl = `${request.nextUrl.origin}/${entry.id}`;
    
    return NextResponse.json({
      id: entry.id,
      original: entry.original,
      shortUrl: shortUrl,
      created: entry.created,
      qrCode: entry.qrCode || null,
      private: !!entry.private,
      title: entry.title || null,
      expiresAt: entry.expiresAt || null,
      maxClicks: entry.maxClicks != null ? entry.maxClicks : null,
    });
  } catch (error) {
    console.error('Shorten error:', error);
    // Surface specific alias errors to client
    if (error.message && (error.message.includes('custom alias') || error.message.includes('already in use') || error.message.includes('Invalid custom'))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to shorten URL' }, { status: 500 });
  }
}
