import fs from 'fs/promises';
import path from 'path';
import * as cosmos from './cosmos';
import { generateQrCodeWithLogo } from './qr';

const useCosmos = !!process.env.COSMOS_MONGODB_URI;
const DATA_FILE = path.join(process.cwd(), 'data', 'urls.json');
const BOT_PATTERNS = ['bot','crawler','spider','slurp','googlebot','bingbot','baiduspider','yandex','duckduckbot','sogou','exabot','facebot','ia_archiver','twitterbot','linkedinbot','slackbot','whatsapp','telegram','discord','facebookexternalhit','skypeuripreview','preview','fetch','scanner','curl','wget','python','go-http','ahrefsbot','semrushbot','dotbot','mj12bot','pinterest','tumblr','vkshare','line','applebot','bingpreview','msnbot','adsbot','mediapartners-google','petalbot','seznambot','coccocbot'];
export function isBotUserAgent(userAgent = '') { const ua = userAgent.toLowerCase(); return !!userAgent && BOT_PATTERNS.some(pattern => ua.includes(pattern)); }

async function readUrlsFile() {
  try {
    const parsed = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8'));
    return (parsed.shorts || []).map(item => ({ ...item, stats: (item.stats || []).map(stat => ({ timestamp: stat.timestamp || new Date().toISOString(), ip: stat.ip || 'unknown', userAgent: stat.userAgent || 'unknown', referer: stat.referer || '', is_bot: !!stat.is_bot })), qrCode: item.qrCode || null, private: !!item.private, title: item.title || null, expiresAt: item.expiresAt || null, maxClicks: item.maxClicks != null ? Number(item.maxClicks) : null, decay: !!item.decay }));
  } catch { return []; }
}
async function saveUrlsFile(shorts) { await fs.writeFile(DATA_FILE, JSON.stringify({ shorts }, null, 2), 'utf-8'); }
function generateShortCode() { const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''); }
async function findUrlByShortFile(short) { return (await readUrlsFile()).find(item => item.id === short); }

async function addShortUrlFile(originalUrl, isPrivate = false, title = null, customSlug = null, expiresAt = null, maxClicks = null, isDecay = false) {
  const shorts = await readUrlsFile();
  const existing = shorts.find(item => item.original === originalUrl && (isDecay ? !!item.decay && !(item.stats || []).length : true));
  if (existing) {
    if (!existing.qrCode) { existing.qrCode = await generateQrCodeWithLogo(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${existing.id}`); await saveUrlsFile(shorts); }
    return existing;
  }
  let shortCode = customSlug && !isDecay ? customSlug.trim() : generateShortCode();
  if (customSlug && !isDecay && (!isValidCustomSlug(shortCode) || shorts.some(item => item.id === shortCode))) throw new Error('Invalid or already-used custom alias.');
  while (shorts.some(item => item.id === shortCode)) shortCode = generateShortCode();
  const newEntry = { id: shortCode, original: originalUrl, created: new Date().toISOString(), stats: [], qrCode: await generateQrCodeWithLogo(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${shortCode}`), private: isDecay ? true : !!isPrivate, title: title || null, expiresAt: isDecay ? null : (expiresAt || null), maxClicks: isDecay ? null : (maxClicks != null ? Number(maxClicks) : null), decay: !!isDecay };
  shorts.push(newEntry); await saveUrlsFile(shorts); return newEntry;
}
async function logAccessFile(short, info) { const shorts = await readUrlsFile(); const item = shorts.find(x => x.id === short); if (!item) return false; item.stats.push({ timestamp: info.timestamp || new Date().toISOString(), ip: info.ip || 'unknown', userAgent: info.userAgent || 'unknown', referer: info.referer || '', is_bot: !!info.isBot }); await saveUrlsFile(shorts); return true; }
async function updateUrlVisibilityFile(short, isPrivate) { const shorts = await readUrlsFile(); const item = shorts.find(x => x.id === short); if (!item) return null; item.private = !!isPrivate; await saveUrlsFile(shorts); return item; }
async function getRecentVisitsFile(limit = 50) { const all = []; for (const item of await readUrlsFile()) for (const stat of item.stats || []) all.push({ short: item.id, original: item.original, ...stat }); return all.sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp)).slice(0, limit); }
async function regenerateQrCodeFile(short) { const shorts = await readUrlsFile(); const item = shorts.find(x => x.id === short); if (!item) return null; item.qrCode = await generateQrCodeWithLogo(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${short}`); await saveUrlsFile(shorts); return item; }
async function updateUrlTitleFile(short, title) { const shorts = await readUrlsFile(); const item = shorts.find(x => x.id === short); if (!item) return null; item.title = title || null; await saveUrlsFile(shorts); return item; }

export async function readUrls() { return useCosmos ? cosmos.readUrls() : readUrlsFile(); }
export async function saveUrls(shorts) { return useCosmos ? cosmos.saveUrls(shorts) : saveUrlsFile(shorts); }
export function generateShortCodeFn() { return generateShortCode(); }
export async function findUrlByShort(short) { return useCosmos ? cosmos.findUrlByShort(short) : findUrlByShortFile(short); }
export async function addShortUrl(...args) { return useCosmos ? cosmos.addShortUrl(...args) : addShortUrlFile(...args); }
export async function logAccess(...args) { return useCosmos ? cosmos.logAccess(...args) : logAccessFile(...args); }
export async function updateUrlVisibility(...args) { return useCosmos ? cosmos.updateUrlVisibility(...args) : updateUrlVisibilityFile(...args); }
export async function deleteShortUrl(short) { return useCosmos ? cosmos.deleteShortUrl(short) : false; }
export async function getRecentVisits(limit=50) { return useCosmos ? cosmos.getRecentVisits(limit) : getRecentVisitsFile(limit); }
export async function regenerateQrCode(short) { return useCosmos ? cosmos.regenerateQrCode(short) : regenerateQrCodeFile(short); }
export async function updateUrlTitle(short, title) { return useCosmos ? cosmos.updateUrlTitle(short, title) : updateUrlTitleFile(short, title); }
export function isUrlExpired(entry) { if (!entry) return true; if (entry.expiresAt && new Date() > new Date(entry.expiresAt)) return true; return entry.maxClicks != null && (entry.stats || []).length >= Number(entry.maxClicks); }
function isValidCustomSlug(slug) { return typeof slug === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(slug) && !['api','login','list','stats','shorten','_next'].includes(slug.toLowerCase()); }
