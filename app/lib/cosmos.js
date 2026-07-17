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
 */

import { MongoClient } from 'mongodb';

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

    // Return in the same shape as file-based: array of {id, original, created, stats}
    return docs.map((doc) => ({
      id: doc.id,
      original: doc.original,
      created: doc.created,
      stats: statsByShort[doc.id] || [],
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
      { $set: { id: item.id, original: item.original, created: item.created } },
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
    };
  } catch (error) {
    console.error('Cosmos MongoDB findUrlByShort error:', error);
    return null;
  }
}

export async function addShortUrl(originalUrl) {
  const coll = await getUrlsCollection();
  const shorts = await readUrls();

  // Check if already exists (by original)
  const existing = shorts.find((item) => item.original === originalUrl);
  if (existing) {
    return existing;
  }

  // Generate unique short code (reuse logic or import)
  let shortCode;
  let attempts = 0;
  do {
    shortCode = generateShortCode();
    attempts++;
    if (attempts > 10) {
      throw new Error('Failed to generate unique short code');
    }
  } while (shorts.some((item) => item.id === shortCode) || (await findUrlByShort(shortCode)));

  const newEntry = {
    id: shortCode,
    original: originalUrl,
    created: new Date().toISOString(),
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

function generateShortCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
