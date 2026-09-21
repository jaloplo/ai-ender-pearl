const RANGE_DAYS = { week: 7, month: 30, quarter: 90 };
function safeDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date; }
function visitorType(stat) { return stat.is_bot === true ? 'bot' : 'human'; }
function dayKey(date) { return date.toISOString().slice(0, 10); }
function startForRange(range, now) { if (range === 'all') return null; const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - ((RANGE_DAYS[range] || 7) - 1)); return start; }
function browserName(userAgent = '') { const ua = userAgent.toLowerCase(); if (ua.includes('edg')) return 'Edge'; if (ua.includes('opr') || ua.includes('opera')) return 'Opera'; if (ua.includes('chrome') && !ua.includes('chromium')) return 'Chrome'; if (ua.includes('firefox')) return 'Firefox'; if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari'; if (ua.includes('msie') || ua.includes('trident')) return 'Internet Explorer'; if (ua.includes('android')) return 'Android Browser'; if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) return 'Bot/Crawler'; return userAgent ? 'Other' : 'Unknown'; }
function botName(userAgent = '') {
  const ua = userAgent.toLowerCase();
  const known = [
    ['Googlebot', 'googlebot'], ['Bingbot', 'bingbot'], ['Slackbot', 'slackbot'],
    ['Twitterbot', 'twitterbot'], ['LinkedInBot', 'linkedinbot'], ['WhatsApp', 'whatsapp'],
    ['TelegramBot', 'telegrambot'], ['Discordbot', 'discordbot'], ['Facebook crawler', 'facebookexternalhit'],
    ['Applebot', 'applebot'], ['GPTBot', 'gptbot'], ['ClaudeBot', 'claudebot'], ['DuckDuckBot', 'duckduckbot']
  ];
  const match = known.find(([, token]) => ua.includes(token));
  if (match) return match[0];
  const token = (userAgent.match(/([a-z][a-z0-9_-]*(?:bot|crawler|spider|preview|headless))/i) || [])[1];
  return token || (userAgent.trim() ? userAgent.trim().slice(0, 48) : 'Unknown bot');
}
function sourceName(referer = '') { if (!referer) return 'Direct / unknown'; try { const host = new URL(referer).hostname.replace(/^www\./, ''); if (host.includes('x.com') || host.includes('twitter.com')) return 'X.com'; if (host.includes('substack.com')) return 'Substack'; if (host.includes('linkedin.com')) return 'LinkedIn'; if (host.includes('facebook.com')) return 'Facebook'; if (host.includes('reddit.com')) return 'Reddit'; return host || 'Other'; } catch { return 'Other'; } }
function dateKeys(start, end) { const keys = []; const cursor = new Date(start); cursor.setHours(0, 0, 0, 0); while (cursor <= end) { keys.push(dayKey(cursor)); cursor.setDate(cursor.getDate() + 1); } return keys; }
function monday(date) { const result = new Date(date); result.setHours(0, 0, 0, 0); result.setDate(result.getDate() - ((result.getDay() + 6) % 7)); return result; }
function weekKey(date) { return dayKey(monday(date)); }

export function buildAnalytics(items, range = 'week') {
  const now = new Date(); const allStats = [];
  for (const item of items || []) for (const stat of item.stats || []) { const date = safeDate(stat.timestamp); if (date) allStats.push({ ...stat, date, itemId: item.id }); }
  const start = startForRange(range, now);
  const matching = allStats.filter(stat => !start || stat.date >= start);
  const aggregateWeeks = range === 'quarter' || range === 'all';
  let first = matching.length ? new Date(Math.min(...matching.map(s => s.date))) : new Date(now); first.setHours(0, 0, 0, 0);
  const periodStart = aggregateWeeks ? monday(start || first) : (start || first);
  const end = new Date(now); end.setHours(0, 0, 0, 0);
  const keys = aggregateWeeks ? (() => { const result = []; const cursor = new Date(periodStart); while (cursor <= end) { result.push(dayKey(cursor)); cursor.setDate(cursor.getDate() + 7); } return result; })() : dateKeys(periodStart, end);
  const byPeriod = Object.fromEntries(keys.map(key => [key, { date: key, human: 0, bot: 0, label: aggregateWeeks ? `Week of ${key.slice(5)}` : undefined }]));
  const browsers = {}; const sources = {}; const bots = {}; const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const stat of matching) {
    const type = visitorType(stat); const key = aggregateWeeks ? weekKey(stat.date) : dayKey(stat.date);
    if (byPeriod[key]) byPeriod[key][type] += 1;
    const browser = browserName(stat.userAgent); const source = sourceName(stat.referer);
    browsers[browser] = (browsers[browser] || 0) + 1; sources[source] = (sources[source] || 0) + 1;
    if (type === 'bot') { const bot = botName(stat.userAgent); bots[bot] = (bots[bot] || 0) + 1; }
    heatmap[(stat.date.getDay() + 6) % 7][stat.date.getHours()] += 1;
  }
  const totalHuman = matching.filter(s => visitorType(s) === 'human').length; const totalBot = matching.length - totalHuman;
  const toRanking = values => Object.entries(values).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  return { range, total: matching.length, human: totalHuman, bot: totalBot, byDay: Object.values(byPeriod), browsers: toRanking(browsers), sources: toRanking(sources), bots: toRanking(bots), heatmap, generatedAt: now.toISOString() };
}
