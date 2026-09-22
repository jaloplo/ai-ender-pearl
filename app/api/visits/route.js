import { NextResponse } from 'next/server';
import { getRecentVisits } from '@/app/lib/urls';
import { classifyVisit } from '@/app/lib/visit-classification';
import { isAllowedOrigin, createForbiddenResponse } from '@/app/lib/security';

export async function GET(request) {
  if (!isAllowedOrigin(request)) return createForbiddenResponse();
  try {
    const visits = (await getRecentVisits(50)).map(visit => ({ ...visit, is_bot: classifyVisit(visit) }));
    return NextResponse.json({ visits });
  } catch (error) {
    console.error('Visits list error:', error);
    return NextResponse.json({ error: 'Failed to retrieve recent visits' }, { status: 500 });
  }
}
