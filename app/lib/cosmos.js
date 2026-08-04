/**
 * Azure Cosmos DB (MongoDB API) connector for URL items management.
 * Uses the official 'mongodb' driver to connect to Cosmos DB's MongoDB-compatible endpoint.
 * Provides the same interface as the file-based urls.js for easy integration.
 *
 * Configuration via environment variables (set in .env or Vercel):
 *   COSMOS_MONGODB_URI  - Full MongoDB connection string from Cosmos DB account (MongoDB API)
 *                         e.g. mongodb://<user>:<password>@<account>.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@<account>@
 *   COSMOS_DATABASE     - Database name (default: 'UrlShortener')
 *   COSMOS_COLLECTION_URLS   - Urls collection name (default: 'urls')
 *   COSMOS_COLLECTION_STATS  - Stats collection name (default: 'stats')
 *
 * Note: When using Cosmos DB with MongoDB API, the connection string is obtained from the Azure portal
 * under "Connection strings" for the MongoDB API.
 *
 * Stats are stored in a separate 'stats' collection (as per requirement), each stat document:
 * { short: "abc123", timestamp, ip, userAgent, referer }
 * When reading URLs, stats are joined/attached from the stats collection.
 *
 * QR codes are stored directly on the URL document as base64 PNG data URL (qrCode field).
 */

import { MongoClient } from 'mongodb';
import { generateQrCodeWithLogo } from './qr';

let client = null;
let db = null;
let urlsCollection = null;
let statsCollection = null;

function getConfig() {
  const uri = process.env.COSMOS_MONGODB_URI;
  const databaseId = process.env.COSMOS_DATABASE || 'UrlShortener';
  const collectionUrlsId = process.env.COSMOS_COLLECTION_URLS || 'urls';
  const collectionStatsId = process.env.COSMOS_COLLECTION_STATS || 'stats';

  if (!uri) {
    return null;
  }

  return { uri, databaseId, collectionUrlsId, collectionStatsId };
}

async function getUrlsCollection() {
  if (urlsCollection) return urlsCollection;

  const config = getConfig();
  if (!config) {
    throw new Error('Cosmos DB (MongoDB API) not configured. Set COSMOS_MONGODB_URI env var.');
  }

  if (!client) {
    client = new MongoClient(config.uri, {
      // Recommended options for Cosmos DB MongoDB API
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
  }

  db = client.db(config.databaseId);
  urlsCollection = db.collection(config.collectionUrlsId);

  return urlsCollection;
}

async function getStatsCollection() {
  if (statsCollection) return statsCollection;

  const config = getConfig();
  if (!config) {
    throw new Error('Cosmos DB (MongoDB API) not configured. Set COSMOS_MONGODB_URI env var.');
  }

  if (!client) {
    client = new MongoClient(config.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
  }

  db = client.db(config.databaseId);
  statsCollection = db.collection(config.collectionStatsId);

  return statsCollection;
}

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

export async function readUrls() {
  try {
    const coll = await getUrlsCollection();
    const docs = await coll.find({}).toArray();

    // Load stats from separate 'stats' collection and attach
    const statsColl = await getStatsCollection();
    const allStatsDocs = await statsColl.find({}).toArray();

    // Group stats by short code
    const statsByShort = {};
    for (const s of allStatsDocs) {
      const sid = s.short;
      if (!sid) continue;
      if (!statsByShort[sid]) statsByShort[sid] = [];
      statsByShort[sid].push({
        timestamp: s.timestamp,
        ip: s.ip || 'unknown',
        userAgent: s.userAgent || 'unknown',
        referer: s.referer || '',
      });
    }

    // Return in the same shape as file-based: array of {id, original, created, stats, qrCode, private, title}
    return docs.map((doc) => ({
      id: doc.id,
      original: doc.original,
      created: doc.created,
      stats: statsByShort[doc.id] || [],
      qrCode: doc.qrCode || null,
      private: !!doc.private,  // default to public (false) if absent
      title: doc.title || null,
    }));
  } catch (error) {
    console.error('Cosmos MongoDB readUrls error:', error);
    // On error (e.g. not configured or network), return empty to avoid breaking
    return [];
  }
}

export async function saveUrls(shorts) {
  // In MongoDB/Cosmos, we don't "save all" - we upsert each.
  // This function is kept for API compatibility with the file-based version.
  // Prefer using addShortUrl / individual upserts in practice.
  // Note: stats are no longer stored inside url docs (separate stats collection)
  const coll = await getUrlsCollection();

  for (const item of shorts) {
    await coll.updateOne(
      { id: item.id },
      { $set: { id: item.id, original: item.original, created: item.created, qrCode: item.qrCode || null, private: !!item.private, title: item.title || null } },
      { upsert: true }
    );
  }
}

export async function findUrlByShort(short) {
  try {
    const coll = await getUrlsCollection();
    const doc = await coll.findOne({ id: short });
    if (!doc) {
      return null;
    }

    // Load stats for this short from separate 'stats' collection
    const statsColl = await getStatsCollection();
    const statsDocs = await statsColl.find({ short: short }).sort({ timestamp: 1 }).toArray();

    const stats = statsDocs.map((s) => ({
      timestamp: s.timestamp,
      ip: s.ip || 'unknown',
      userAgent: s.userAgent || 'unknown',
      referer: s.referer || '',
    }));

    return {
      id: doc.id,
      original: doc.original,
      created: doc.created,
      stats,
      qrCode: doc.qrCode || null,
      private: !!doc.private,
      title: doc.title || null,
    };
  } catch (error) {
    console.error('Cosmos MongoDB findUrlByShort error:', error);
    return null;
  }
}

export async function addShortUrl(originalUrl, isPrivate = false, title = null, customSlug = null) {
  const coll = await getUrlsCollection();
  const shorts = await readUrls();

  // Check if already exists (by original)
  const existing = shorts.find((item) => item.original === originalUrl);
  if (existing) {
    // backfill qr if missing
    if (!existing.qrCode) {
      const shortUrlForQr = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${existing.id}`;
      existing.qrCode = await generateQrCodeWithLogo(shortUrlForQr);
      await coll.updateOne({ id: existing.id }, { $set: { qrCode: existing.qrCode } });
    }
    return existing;
  }

  let shortCode;
  if (customSlug) {
    const trimmedSlug = customSlug.trim();
    if (!isValidCustomSlug(trimmedSlug)) {
      throw new Error('Invalid custom alias. Use 1-64 letters, numbers, hyphens or underscores only. Avoid reserved words.');
    }
    // Uniqueness check (exact match)
    if (shorts.some((item) => item.id === trimmedSlug) || (await findUrlByShort(trimmedSlug))) {
      throw new Error('This custom alias is already in use. Please choose a different one.');
    }
    shortCode = trimmedSlug;
  } else {
    // Generate unique short code (reuse logic or import)
    let attempts = 0;
    do {
      shortCode = generateShortCode();
      attempts++;
      if (attempts > 10) {
        throw new Error('Failed to generate unique short code');
      }
    } while (shorts.some((item) => item.id === shortCode) || (await findUrlByShort(shortCode)));
  }

  const shortUrlForQr = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${shortCode}`;
  const qrCode = await generateQrCodeWithLogo(shortUrlForQr);

  const newEntry = {
    id: shortCode,
    original: originalUrl,
    created: new Date().toISOString(),
    qrCode,
    private: !!isPrivate,
    title: title || null,
    // stats stored separately in 'stats' collection
  };

  await coll.insertOne(newEntry);

  return {
    ...newEntry,
    stats: [],
  };
}

export async function logAccess(short, accessInfo) {
  // Save the access stat into the separate 'stats' collection/table
  try {
    const statsColl = await getStatsCollection();
    const statDoc = {
      short: short,
      timestamp: accessInfo.timestamp || new Date().toISOString(),
      ip: accessInfo.ip || 'unknown',
      userAgent: accessInfo.userAgent || 'unknown',
      referer: accessInfo.referer || '',
    };
    await statsColl.insertOne(statDoc);
    return true;
  } catch (error) {
    console.error('Cosmos MongoDB logAccess error:', error);
    return false;
  }
}

export async function updateUrlVisibility(short, isPrivate) {
  try {
    const coll = await getUrlsCollection();
    const result = await coll.updateOne(
      { id: short },
      { $set: { private: !!isPrivate } }
    );
    if (result.matchedCount === 0) {
      return null;
    }
    // Return the updated item (re-fetch for consistency)
    return await findUrlByShort(short);
  } catch (error) {
    console.error('Cosmos MongoDB updateUrlVisibility error:', error);
    return null;
  }
}

function generateShortCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Export validator for potential client or other use
export { isValidCustomSlug };
