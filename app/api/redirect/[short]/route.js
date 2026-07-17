import { NextResponse } from 'next/server';
import { findUrlByShort } from '@/app/lib/urls';

export async function GET(request, { params }) {
  const { short } = params;

  if (!short) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const entry = await findUrlByShort(short);

  if (entry && entry.original) {
    // 302 redirect (temporary) to original URL
    return NextResponse.redirect(entry.original, 302);
  }

  // Not found - redirect to home
  return NextResponse.redirect(new URL('/?error=notfound', request.url));
}
