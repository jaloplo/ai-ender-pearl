import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'urls.json');

export async function readUrls() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.shorts || [];
  } catch (error) {
    // If file doesn't exist or invalid, return empty
    return [];
  }
}

export async function saveUrls(shorts) {
  const data = { shorts };
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function generateShortCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function findUrlByShort(short) {
  const shorts = await readUrls();
  return shorts.find(item => item.id === short);
}

export async function addShortUrl(originalUrl) {
  const shorts = await readUrls();
  
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
  };
  
  shorts.push(newEntry);
  await saveUrls(shorts);
  
  return newEntry;
}
