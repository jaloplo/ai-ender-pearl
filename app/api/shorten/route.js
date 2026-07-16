import { NextResponse } from 'next/server';
import { addShortUrl } from '@/app/lib/urls';

export async function POST(request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    
    // Basic URL validation
    let validUrl;
    try {
      validUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }
    
    const entry = await addShortUrl(validUrl.toString());
    
    const shortUrl = `${request.nextUrl.origin}/api/redirect/${entry.id}`;
    
    return NextResponse.json({
      id: entry.id,
      original: entry.original,
      shortUrl: shortUrl,
      created: entry.created,
    });
  } catch (error) {
    console.error('Shorten error:', error);
    return NextResponse.json({ error: 'Failed to shorten URL' }, { status: 500 });
  }
}
