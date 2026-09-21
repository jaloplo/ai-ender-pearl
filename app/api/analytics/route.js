import { NextResponse } from 'next/server';
import { readUrls } from '@/app/lib/urls';
import { buildAnalytics } from '@/app/lib/analytics';
import { isAllowedOrigin, createForbiddenResponse } from '@/app/lib/security';

export async function GET(request) {
  if (!isAllowedOrigin(request)) return createForbiddenResponse();
  const range = request.nextUrl.searchParams.get('range') || 'week';
  const short = request.nextUrl.searchParams.get('short');
  if (!['week', 'month', 'quarter', 'all'].includes(range)) {
    return NextResponse.json({ error: 'Invalid range' }, { status: 400 });
  }
  try {
    const items = await readUrls();
    const selected = short ? items.filter(item => item.id === short) : items;
    if (short && selected.length === 0) return NextResponse.json({ error: 'Short URL not found' }, { status: 404 });
    return NextResponse.json(buildAnalytics(selected, range));
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to retrieve analytics' }, { status: 500 });
  }
}
