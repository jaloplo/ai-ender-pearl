// Shared visit classification utilities. Keep this module dependency-free so it
// can be reused by API boundaries, storage adapters, and analytics aggregation.
export const BOT_PATTERNS = [
  // Generic bot markers
  'bot', 'crawler', 'spider',

  // Search crawlers
  'googlebot', 'googleother', 'google-inspectiontool', 'google-agent',
  'storebot-google', 'adsbot-google', 'apis-google', 'bingbot',
  'bingpreview', 'baiduspider', 'yandexbot', 'duckduckbot',
  'yahoo! slurp', 'sogou', 'exabot', 'seznambot', 'coccocbot',
  'petalbot', 'applebot', 'bytespider', 'amazonbot',

  // Social and messaging previews
  'facebookexternalhit', 'facebot', 'twitterbot', 'linkedinbot',
  'slackbot', 'whatsapp', 'telegrambot', 'discordbot',
  'skypeuripreview', 'pinterestbot', 'vkshare', 'mastodon', 'Iceshrimp',
  'Akkoma', 'Friendica', 'SubstackContentFetch',

  // AI crawlers and fetchers
  'gptbot', 'chatgpt-user', 'claudebot', 'anthropic-ai',
  'perplexitybot', 'ccbot', 'got', 'Goodgorithm',

  // SEO, archives, and monitoring
  'ia_archiver', 'ahrefsbot', 'semrushbot', 'dotbot', 'mj12bot',
  'uptimerobot', 'axios', 'node'
];

export function isBotUserAgent(userAgent = '') {
  const value = String(userAgent || '').toLowerCase();
  return Boolean(value) && BOT_PATTERNS.some(pattern => value.includes(pattern));
}

/**
 * Preserve an explicit persisted classification. Only legacy records without
 * either flag fall back to their original User-Agent.
 */
export function classifyVisit(stat = {}) {
  // if (stat.is_bot === true || stat.isBot === true) return true;
  // if (stat.is_bot === false || stat.isBot === false) return false;
  return isBotUserAgent(stat.userAgent);
}

export function normalizeVisitStat(stat = {}) {
  return {
    ...stat,
    timestamp: stat.timestamp || new Date().toISOString(),
    ip: stat.ip || 'unknown',
    userAgent: stat.userAgent || 'unknown',
    referer: stat.referer || '',
    is_bot: classifyVisit(stat),
  };
}
