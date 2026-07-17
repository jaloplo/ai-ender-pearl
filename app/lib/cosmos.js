/**
 * Azure Cosmos DB (MongoDB API) connector for URL items management.
 * Uses the official 'mongodb' driver to connect to Cosmos DB's MongoDB-compatible endpoint.
 * Provides the same interface as the file-based urls.js for easy integration.
 *
 * Configuration via environment variables (set in .env or Vercel):
 *   COSMOS_MONGODB_URI  - Full MongoDB connection string from Cosmos DB account (MongoDB API)
 *                         e.g. mongodb://<user>:<password>@<account>.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@<account>@
 *   COSMOS_DATABASE     - Database name (default: 'UrlShortener')
 *   COSMOS_COLLECTION   - Collection name (default: 'urls')
 *
 * Note: When using Cosmos DB with MongoDB API, the connection string is obtained from the Azure portal
 * under "Connection strings" for the MongoDB API.
 */

import { MongoClient } from 'mongodb';

let client = null;
let db = null;
let collection = null;

function getConfig() {
  const uri = process.env.COSMOS_MONGODB_URI;
  const databaseId = process.env.COSMOS_DATABASE || 'UrlShortener';
  const collectionId = process.env.COSMOS_COLLECTION || 'urls';

  if (!uri) {
    return null;
  }

  return { uri, databaseId, collectionId };
}

async function getCollection() {
  if (collection) return collection;

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
  collection = db.collection(config.collectionId);

  return collection;
}

export async function readUrls() {
  try {
    const coll = await getCollection();
    const docs = await coll.find({}).toArray();

    // Return in the same shape as file-based: array of {id, original, created}
    return docs.map((doc) => ({
      id: doc.id,
      original: doc.original,
      created: doc.created,
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
  const coll = await getCollection();

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
    const coll = await getCollection();
    const doc = await coll.findOne({ id: short });
    if (doc) {
      return {
        id: doc.id,
        original: doc.original,
        created: doc.created,
      };
    }
    return null;
  } catch (error) {
    console.error('Cosmos MongoDB findUrlByShort error:', error);
    return null;
  }
}

export async function addShortUrl(originalUrl) {
  const coll = await getCollection();
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
  };

  await coll.insertOne(newEntry);

  return newEntry;
}

function generateShortCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
