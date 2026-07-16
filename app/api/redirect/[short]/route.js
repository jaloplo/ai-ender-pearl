import { NextResponse } from 'next/server';
import { findUrlByShort } from '@/app/lib/urls';

export async function GET(request, { params }) {
  try {
    const { short } = params;
    
    if (!short) {
      return NextResponse.json({ error: 'Short code required' }, { status: 400 });
    }
    
    const entry = await findUrlByShort(short);
    
    if (!entry) {
      return new NextResponse('Short URL not found', { status: 404 });
    }
    
    // Perform redirect
    return NextResponse.redirect(entry.original, 302);
  } catch (error) {
    console.error('Redirect error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
