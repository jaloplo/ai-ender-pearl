import { NextResponse } from 'next/server';
import { readUrls } from '@/app/lib/urls';
import { isAllowedOrigin, createForbiddenResponse } from '@/app/lib/security';

export async function GET(request) {
  // Security: only allow same-domain calls (consistent with other public APIs)
  if (!isAllowedOrigin(request)) {
    return createForbiddenResponse();
  }

  try {
    const shorts = await readUrls();
    const count = shorts.length;

    let example = null;
    if (count > 0) {
      const first = shorts[0];
      const origin = request.nextUrl.origin;
      example = {
        id: first.id,
        original: first.original,
        shortUrl: `${origin}/${first.id}`,
        created: first.created,
      };
    }

    return NextResponse.json({ count, example });
  } catch (error) {
    console.error('Public stats error:', error);
    return NextResponse.json({ count: 0, example: null }, { status: 200 });
  }
}
