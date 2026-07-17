import { redirect } from 'next/navigation';
import { findUrlByShort } from '@/app/lib/urls';

export default async function ShortRedirectPage({ params }) {
  const { short } = params;

  if (!short) {
    redirect('/');
  }

  const entry = await findUrlByShort(short);

  if (entry && entry.original) {
    // Perform 302 redirect to the original URL
    redirect(entry.original);
  }

  // If not found, redirect to home with error hint (or could show 404)
  redirect('/?error=notfound');
}
