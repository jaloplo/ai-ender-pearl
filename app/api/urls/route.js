import { NextResponse } from 'next/server';
import { readUrls } from '@/app/lib/urls';
import { isAllowedOrigin, createForbiddenResponse } from '@/app/lib/security';

export async function GET(request) {
  // Security: only allow same-domain calls
  if (!isAllowedOrigin(request)) {
    return createForbiddenResponse();
  }

  try {
    const shorts = await readUrls();
    
    const origin = request.nextUrl.origin;
    
    const items = shorts.map(item => ({
      ...item,
      shortUrl: `${origin}/${item.id}`,
    }));
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error('List error:', error);
    return NextResponse.json({ error: 'Failed to retrieve URLs' }, { status: 500 });
  }
}
