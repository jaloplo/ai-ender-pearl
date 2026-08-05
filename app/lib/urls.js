import fs from 'fs/promises';
import path from 'path';
import * as cosmos from './cosmos';
import { generateQrCodeWithLogo } from './qr';

// Detect if Cosmos DB (MongoDB API) is configured via env vars
const useCosmos = !!process.env.COSMOS_MONGODB_URI;

const DATA_FILE = path.join(process.cwd(), 'data', 'urls.json');

// Slug validation helper (shared logic for custom alias)
function isValidCustomSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  const trimmed = slug.trim();
  if (trimmed.length < 1 || trimmed.length > 64) return false;
  // Allow letters, numbers, hyphens, underscores. No spaces or other special chars.
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return false;
  // Reserved system paths (case-insensitive check)
  const reserved = ['api', 'login', 'list', 'stats', 'shorten', '_next', 'favicon.ico', 'icon'];
  if (reserved.includes(trimmed.toLowerCase())) return false;
  return true;
}

// File-based implementations (original)
async function readUrlsFile() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    const shorts = parsed.shorts || [];
    // Normalize to always include stats array, qrCode, private flag, title, expiration fields, and decay for backward compat
    return shorts.map(item => ({
      ...item,
      stats: item.stats || [],
      qrCode: item.qrCode || null,
      private: !!item.private,  // default to public (false) if absent
      title: item.title || null,
      expiresAt: item.expiresAt || null,
      maxClicks: item.maxClicks != null ? Number(item.maxClicks) : null,
      decay: !!item.decay,  // decay / burn-after-reading flag (default false)
    }));
  } catch (error) {
    // If file doesn't exist or invalid, return empty
    return [];
  }
}

async function saveUrlsFile(shorts) {
  const data = { shorts };
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function generateShortCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function findUrlByShortFile(short) {
  const shorts = await readUrlsFile();
  return shorts.find(item => item.id === short);
}

async function addShortUrlFile(originalUrl, isPrivate = false, title = null, customSlug = null, expiresAt = null, maxClicks = null, isDecay = false) {
  const shorts = await readUrlsFile();
  
  // Check if already exists
  const existing = shorts.find(item => item.original === originalUrl);
  if (existing) {
    // If existing but no qrCode, generate one now (backfill)
    if (!existing.qrCode) {
      const shortUrlForQr = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${existing.id}`;
      existing.qrCode = await generateQrCodeWithLogo(shortUrlForQr);
      await saveUrlsFile(shorts);
    }
    return existing;
  }
  
  let shortCode;
  if (customSlug && !isDecay) {
    const trimmedSlug = customSlug.trim();
    if (!isValidCustomSlug(trimmedSlug)) {
      throw new Error('Invalid custom alias. Use 1-64 letters, numbers, hyphens or underscores only. Avoid reserved words.');
    }
    // Uniqueness check (exact match)
    if (shorts.some(item => item.id === trimmedSlug)) {
      throw new Error('This custom alias is already in use. Please choose a different one.');
    }
    shortCode = trimmedSlug;
  } else {
    let attempts = 0;
    do {
      shortCode = generateShortCode();
      attempts++;
      if (attempts > 10) {
        throw new Error('Failed to generate unique short code');
      }
    } while (shorts.some(item => item.id === shortCode));
  }
  
  const shortUrlForQr = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${shortCode}`;
  const qrCode = await generateQrCodeWithLogo(shortUrlForQr);

  // For decay links: always private, ignore custom/exp/max
  const effectivePrivate = isDecay ? true : !!isPrivate;
  const effectiveExpires = isDecay ? null : expiresAt;
  const effectiveMax = isDecay ? null : maxClicks;

  const newEntry = {
    id: shortCode,
    original: originalUrl,
    created: new Date().toISOString(),
    stats: [],
    qrCode,
    private: effectivePrivate,
    title: title || null,
    expiresAt: effectiveExpires || null,
    maxClicks: effectiveMax != null ? Number(effectiveMax) : null,
    decay: !!isDecay,
  };
  
  shorts.push(newEntry);
  await saveUrlsFile(shorts);
  
  return newEntry;
}

async function logAccessFile(short, accessInfo) {
  const shorts = await readUrlsFile();
  const idx = shorts.findIndex(item => item.id === short);
  if (idx === -1) {
    return false;
  }
  if (!shorts[idx].stats) {
    shorts[idx].stats = [];
  }
  shorts[idx].stats.push({
    timestamp: accessInfo.timestamp || new Date().toISOString(),
    ip: accessInfo.ip || 'unknown',
    userAgent: accessInfo.userAgent || 'unknown',
    referer: accessInfo.referer || '',
  });
  await saveUrlsFile(shorts);
  return true;
}

async function updateUrlVisibilityFile(short, isPrivate) {
  const shorts = await readUrlsFile();
  const idx = shorts.findIndex(item => item.id === short);
  if (idx === -1) {
    return null;
  }
  shorts[idx].private = !!isPrivate;
  await saveUrlsFile(shorts);
  return shorts[idx];
}

async function deleteShortUrlFile(short) {
  const shorts = await readUrlsFile();
  const filtered = shorts.filter(item => item.id !== short);
  if (filtered.length === shorts.length) {
    return false; // not found
  }
  await saveUrlsFile(filtered);
  return true;
}

// Public API - delegates to Cosmos (MongoDB API) or file storage
export async function readUrls() {
  if (useCosmos) {
    return cosmos.readUrls();
  }
  return readUrlsFile();
}

export async function saveUrls(shorts) {
  if (useCosmos) {
    return cosmos.saveUrls(shorts);
  }
  return saveUrlsFile(shorts);
}

export function generateShortCodeFn() {
  return generateShortCode();
}

export async function findUrlByShort(short) {
  if (useCosmos) {
    return cosmos.findUrlByShort(short);
  }
  return findUrlByShortFile(short);
}

export async function addShortUrl(originalUrl, isPrivate = false, title = null, customSlug = null, expiresAt = null, maxClicks = null, isDecay = false) {
  if (useCosmos) {
    return cosmos.addShortUrl(originalUrl, isPrivate, title, customSlug, expiresAt, maxClicks, isDecay);
  }
  return addShortUrlFile(originalUrl, isPrivate, title, customSlug, expiresAt, maxClicks, isDecay);
}

export async function logAccess(short, accessInfo) {
  if (useCosmos) {
    return cosmos.logAccess(short, accessInfo);
  }
  return logAccessFile(short, accessInfo);
}

export async function updateUrlVisibility(short, isPrivate) {
  if (useCosmos) {
    return cosmos.updateUrlVisibility(short, isPrivate);
  }
  return updateUrlVisibilityFile(short, isPrivate);
}

export async function deleteShortUrl(short) {
  if (useCosmos) {
    return cosmos.deleteShortUrl(short);
  }
  return deleteShortUrlFile(short);
}

// Export validator for potential client or other use
export { isValidCustomSlug };

// Helper to check if a URL entry has expired (by date or click count)
// Exported for use in redirect and other places
export function isUrlExpired(entry) {
  if (!entry) return true;
  const now = new Date();
  if (entry.expiresAt) {
    const expDate = new Date(entry.expiresAt);
    if (now > expDate) return true;
  }
  const currentClicks = (entry.stats || []).length;
  if (entry.maxClicks != null && currentClicks >= Number(entry.maxClicks)) {
    return true;
  }
  return false;
}
