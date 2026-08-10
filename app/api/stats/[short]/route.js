import { NextResponse } from 'next/server';
import { findUrlByShort, regenerateQrCode } from '@/app/lib/urls';
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
      qrCode: entry.qrCode || null,
      private: !!entry.private,
      title: entry.title || null,
      expiresAt: entry.expiresAt || null,
      maxClicks: entry.maxClicks != null ? entry.maxClicks : null,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to retrieve stats' }, { status: 500 });
  }
}

// POST: Regenerate QR code for this short URL (protected by middleware + origin check)
export async function POST(request, { params }) {
  // Security: only allow same-domain calls
  if (!isAllowedOrigin(request)) {
    return createForbiddenResponse();
  }

  const { short } = params;

  if (!short) {
    return NextResponse.json({ error: 'Short code is required' }, { status: 400 });
  }

  try {
    const updated = await regenerateQrCode(short);

    if (!updated) {
      return NextResponse.json({ error: 'Short URL not found' }, { status: 404 });
    }

    const stats = updated.stats || [];
    const accessCount = stats.length;

    return NextResponse.json({
      id: updated.id,
      original: updated.original,
      created: updated.created,
      accessCount,
      stats: stats,
      qrCode: updated.qrCode || null,
      private: !!updated.private,
      title: updated.title || null,
      expiresAt: updated.expiresAt || null,
      maxClicks: updated.maxClicks != null ? updated.maxClicks : null,
      regenerated: true,
    });
  } catch (error) {
    console.error('QR regenerate error:', error);
    return NextResponse.json({ error: 'Failed to regenerate QR code' }, { status: 500 });
  }
}
