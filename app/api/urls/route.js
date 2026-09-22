import { NextResponse } from 'next/server';
import { readUrls, isBotUserAgent } from '@/app/lib/urls';
import { classifyVisit } from '@/app/lib/visit-classification';
import { isAllowedOrigin, createForbiddenResponse } from '@/app/lib/security';

export async function GET(request) {
  if (!isAllowedOrigin(request)) return createForbiddenResponse();
  try {
    const origin = request.nextUrl.origin;
    const items = (await readUrls()).map(item => ({
      ...item,
      shortUrl: `${origin}/${item.id}`,
      stats: (item.stats || []).map(stat => ({ ...stat, is_bot: classifyVisit(stat) })),
      private: !!item.private,
      expiresAt: item.expiresAt || null,
      maxClicks: item.maxClicks != null ? item.maxClicks : null,
      decay: !!item.decay,
    }));
    return NextResponse.json({ items });
  } catch (error) {
    console.error('List error:', error);
    return NextResponse.json({ error: 'Failed to retrieve URLs' }, { status: 500 });
  }
}
