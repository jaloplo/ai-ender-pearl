import fs from 'fs/promises';
import path from 'path';
import * as cosmos from './cosmos';

// Detect if Cosmos DB (MongoDB API) is configured via env vars
const useCosmos = !!process.env.COSMOS_MONGODB_URI;

const DATA_FILE = path.join(process.cwd(), 'data', 'urls.json');

// File-based implementations (original)
async function readUrlsFile() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    const shorts = parsed.shorts || [];
    // Normalize to always include stats array for backward compat
    return shorts.map(item => ({
      ...item,
      stats: item.stats || [],
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

async function addShortUrlFile(originalUrl) {
  const shorts = await readUrlsFile();
  
  // Check if already exists
  const existing = shorts.find(item => item.original === originalUrl);
  if (existing) {
    return existing;
  }
  
  let shortCode;
  let attempts = 0;
  do {
    shortCode = generateShortCode();
    attempts++;
    if (attempts > 10) {
      throw new Error('Failed to generate unique short code');
    }
  } while (shorts.some(item => item.id === shortCode));
  
  const newEntry = {
    id: shortCode,
    original: originalUrl,
    created: new Date().toISOString(),
    stats: [],
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

export async function addShortUrl(originalUrl) {
  if (useCosmos) {
    return cosmos.addShortUrl(originalUrl);
  }
  return addShortUrlFile(originalUrl);
}

export async function logAccess(short, accessInfo) {
  if (useCosmos) {
    return cosmos.logAccess(short, accessInfo);
  }
  return logAccessFile(short, accessInfo);
}
