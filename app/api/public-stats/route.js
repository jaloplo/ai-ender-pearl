import { NextResponse } from 'next/server';
import { readUrls } from '@/app/lib/urls';
import { isAllowedOrigin, createForbiddenResponse } from '@/app/lib/security';

export async function GET(request) {
  // Security: only allow same-domain calls (consistent with other public APIs)
  if (!isAllowedOrigin(request)) {
    return createForbiddenResponse();
  }

  try {
    const allShorts = await readUrls();
    // Only public URLs (private: false or absent) are shown in public stats/recent
    const shorts = allShorts.filter(item => !item.private);

    const count = shorts.length;

    // Sort by created desc to get most recent first
    const sorted = [...shorts].sort((a, b) => {
      return new Date(b.created || 0) - new Date(a.created || 0);
    });

    const origin = request.nextUrl.origin;

    // Up to 5 recent public short URLs
    const recent = sorted.slice(0, 5).map((item) => ({
      id: item.id,
      original: item.original,
      shortUrl: `${origin}/${item.id}`,
      created: item.created,
      title: item.title || null,
    }));

    // Compute unique domains from originals (public only)
    const domains = new Set();
    shorts.forEach((s) => {
      try {
        const u = new URL(s.original);
        if (u.hostname) {
          domains.add(u.hostname.toLowerCase());
        }
      } catch (e) {
        // ignore invalid
      }
    });
    const uniqueDomains = domains.size;

    // Monthly growth teaser: count created this calendar month (public only)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = shorts.filter((s) => {
      const d = new Date(s.created || 0);
      return d >= monthStart;
    }).length;

    // Total clicks (accesses) across all public shortened URLs
    const totalClicks = shorts.reduce((sum, s) => {
      return sum + ((s.stats && Array.isArray(s.stats)) ? s.stats.length : 0);
    }, 0);

    return NextResponse.json({
      count,
      recent,
      uniqueDomains,
      thisMonth,
      totalClicks,
    });
  } catch (error) {
    console.error('Public stats error:', error);
    return NextResponse.json(
      { count: 0, recent: [], uniqueDomains: 0, thisMonth: 0, totalClicks: 0 },
      { status: 200 }
    );
  }
}
