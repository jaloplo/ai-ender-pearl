import { NextResponse } from 'next/server';
import { getRecentVisits } from '@/app/lib/urls';
import { isAllowedOrigin, createForbiddenResponse } from '@/app/lib/security';

export async function GET(request) {
  // Security: only allow same-domain calls (protected like /api/urls)
  if (!isAllowedOrigin(request)) {
    return createForbiddenResponse();
  }

  try {
    // Strictly enforce LIMIT 50, sorted by timestamp descending (most recent first)
    const visits = await getRecentVisits(50);
    return NextResponse.json({ visits });
  } catch (error) {
    console.error('Visits list error:', error);
    return NextResponse.json({ error: 'Failed to retrieve recent visits' }, { status: 500 });
  }
}
