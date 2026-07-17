import { NextResponse } from 'next/server';
import { findUrlByShort } from '@/app/lib/urls';
import { isAllowedOrigin, createForbiddenResponse } from '@/app/lib/security';

export async function GET(request, { params }) {
  // Security: only allow same-domain calls
  if (!isAllowedOrigin(request)) {
    return createForbiddenResponse();
  }

  const { short } = params;

  if (!short) {
    return NextResponse.json({ error: 'Short code is required' }, { status: 400 });
  }

  try {
    const entry = await findUrlByShort(short);

    if (!entry) {
      return NextResponse.json({ error: 'Short URL not found' }, { status: 404 });
    }

    const stats = entry.stats || [];
    const accessCount = stats.length;

    return NextResponse.json({
      id: entry.id,
      original: entry.original,
      created: entry.created,
      accessCount,
      stats: stats, // array of {timestamp, ip, userAgent, referer}
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to retrieve stats' }, { status: 500 });
  }
}
