import { NextResponse } from 'next/server';
import { readUrls } from '@/app/lib/urls';
import { isAllowedOrigin, createForbiddenResponse } from '@/app/lib/security';

export async function GET(request) {
  if (!isAllowedOrigin(request)) return createForbiddenResponse();
  try {
    const allShorts = await readUrls();
    const shorts = allShorts.filter((item) => !item.private);
    const sorted = [...shorts].sort((a, b) => new Date(b.created || 0) - new Date(a.created || 0));
    const origin = request.nextUrl.origin;
    const recent = sorted.slice(0, 5).map((item) => ({
      id: item.id,
      original: item.original,
      shortUrl: `${origin}/${item.id}`,
      created: item.created,
      title: item.title || null,
      qrCode: item.qrCode || null,
      expiresAt: item.expiresAt || null,
      maxClicks: item.maxClicks != null ? item.maxClicks : null,
    }));
    const domains = new Set();
    shorts.forEach((item) => { try { const url = new URL(item.original); if (url.hostname) domains.add(url.hostname.toLowerCase()); } catch (_) {} });
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = shorts.filter((item) => new Date(item.created || 0) >= monthStart).length;
    const totalClicks = shorts.reduce((sum, item) => sum + (Array.isArray(item.stats) ? item.stats.length : 0), 0);
    return NextResponse.json({ count: shorts.length, recent, uniqueDomains: domains.size, thisMonth, totalClicks });
  } catch (error) {
    console.error('Public stats error:', error);
    return NextResponse.json({ count: 0, recent: [], uniqueDomains: 0, thisMonth: 0, totalClicks: 0 });
  }
}
