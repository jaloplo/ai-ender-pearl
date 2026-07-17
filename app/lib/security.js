/**
 * Security utility for API layer: same-domain / same-origin enforcement.
 * Allows calls from:
 * - Exact same host (http/https)
 * - localhost / 127.0.0.1 (any port) for local dev
 * - Any *.vercel.app deployment (for Vercel previews/prod)
 * - Explicit VERCEL_URL if set
 *
 * This works for both localhost and Vercel deployments without hardcoding URLs.
 */

export function isAllowedOrigin(request) {
  const originHeader = request.headers.get('origin');
  const refererHeader = request.headers.get('referer');
  const host = request.headers.get('host') || request.nextUrl?.host || '';

  // If no origin (e.g. direct server fetch, curl, or same-origin without CORS header), allow
  // but prefer origin when present for browser calls
  if (!originHeader && !refererHeader) {
    return true;
  }

  const candidates = [];
  if (originHeader) candidates.push(originHeader);
  if (refererHeader) candidates.push(refererHeader);

  for (const candidate of candidates) {
    try {
      const url = new URL(candidate);
      const originHost = url.host.toLowerCase();
      const currentHost = host.toLowerCase();

      // Exact match (same domain, including port if present)
      if (originHost === currentHost) {
        return true;
      }

      // Local development
      if (
        originHost.includes('localhost') ||
        originHost.includes('127.0.0.1') ||
        originHost.startsWith('localhost:') ||
        originHost.startsWith('127.0.0.1:')
      ) {
        return true;
      }

      // Vercel deployments (prod, preview, etc.)
      if (originHost.endsWith('.vercel.app')) {
        return true;
      }

      // Explicit Vercel URL env (set automatically on Vercel)
      const vercelUrl = process.env.VERCEL_URL;
      if (vercelUrl && originHost === vercelUrl.toLowerCase()) {
        return true;
      }

      // Also support NEXT_PUBLIC_VERCEL_URL if used
      const publicVercel = process.env.NEXT_PUBLIC_VERCEL_URL;
      if (publicVercel && originHost === publicVercel.toLowerCase()) {
        return true;
      }
    } catch (e) {
      // invalid URL, skip
    }
  }

  return false;
}

export function createForbiddenResponse() {
  return new Response(
    JSON.stringify({ error: 'Forbidden: API calls are restricted to the same domain' }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
