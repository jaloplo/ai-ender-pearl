import { NextResponse } from 'next/server';
import { updateUrlVisibility, findUrlByShort } from '@/app/lib/urls';
import { isAllowedOrigin, createForbiddenResponse } from '@/app/lib/security';

export async function PATCH(request, { params }) {
  // Security: only allow same-domain calls
  if (!isAllowedOrigin(request)) {
    return createForbiddenResponse();
  }

  const { id: short } = params;

  if (!short) {
    return NextResponse.json({ error: 'Short code is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { private: isPrivate } = body;

    if (typeof isPrivate !== 'boolean') {
      return NextResponse.json({ error: 'private field (boolean) is required' }, { status: 400 });
    }

    const updated = await updateUrlVisibility(short, isPrivate);

    if (!updated) {
      return NextResponse.json({ error: 'Short URL not found' }, { status: 404 });
    }

    const origin = request.nextUrl.origin;

    return NextResponse.json({
      id: updated.id,
      original: updated.original,
      shortUrl: `${origin}/${updated.id}`,
      created: updated.created,
      accessCount: (updated.stats || []).length,
      qrCode: updated.qrCode || null,
      private: !!updated.private,
      expiresAt: updated.expiresAt || null,
      maxClicks: updated.maxClicks != null ? updated.maxClicks : null,
    });
  } catch (error) {
    console.error('Update visibility error:', error);
    return NextResponse.json({ error: 'Failed to update visibility' }, { status: 500 });
  }
}
