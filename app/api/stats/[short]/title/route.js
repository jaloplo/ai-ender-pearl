import { NextResponse } from 'next/server';
import { findUrlByShort, updateUrlTitle } from '@/app/lib/urls';
import { fetchPageTitle } from '@/app/lib/page-title';
import { isAllowedOrigin, createForbiddenResponse } from '@/app/lib/security';

export async function POST(request, { params }) {
  if (!isAllowedOrigin(request)) return createForbiddenResponse();
  const { short } = params;
  if (!short) return NextResponse.json({ error: 'Short code is required' }, { status: 400 });

  try {
    const entry = await findUrlByShort(short);
    if (!entry) return NextResponse.json({ error: 'Short URL not found' }, { status: 404 });

    const title = await fetchPageTitle(entry.original);
    if (!title) return NextResponse.json({ error: 'Could not read a page title from the original URL' }, { status: 422 });

    const updated = await updateUrlTitle(short, title);
    return NextResponse.json({ title: updated?.title || title });
  } catch (error) {
    console.error('Title refresh error:', error);
    return NextResponse.json({ error: 'Failed to refresh page title' }, { status: 500 });
  }
}
