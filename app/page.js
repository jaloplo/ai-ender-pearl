'use client';

import { useState, useEffect } from 'react';

export default function ShortenPage() {
  const [standardUrl, setStandardUrl] = useState('');
  const [decayUrl, setDecayUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxClicks, setMaxClicks] = useState('');
  const [standardResult, setStandardResult] = useState(null);
  const [decayResult, setDecayResult] = useState(null);
  const [standardError, setStandardError] = useState('');
  const [decayError, setDecayError] = useState('');
  const [standardLoading, setStandardLoading] = useState(false);
  const [decayLoading, setDecayLoading] = useState(false);
  const [stats, setStats] = useState({ count: 0, recent: [], uniqueDomains: 0, thisMonth: 0, totalClicks: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/public-stats');
      if (res.ok) {
        const data = await res.json();
        setStats({ count: data.count || 0, recent: data.recent || [], uniqueDomains: data.uniqueDomains || 0, thisMonth: data.thisMonth || 0, totalClicks: data.totalClicks || 0 });
      }
    } catch (_) {}
  };

  useEffect(() => {
    (async () => { setStatsLoading(true); await fetchStats(); setStatsLoading(false); })();
    fetch('/api/auth/status').then((r) => r.ok ? r.json() : null).then((d) => setIsAuthenticated(d?.authenticated === true)).catch(() => setIsAuthenticated(false));
  }, []);

  const handleSubmit = async (e, urlValue, decay = false) => {
    e.preventDefault();
    if (decay) { setDecayError(''); setDecayResult(null); } else { setStandardError(''); setStandardResult(null); }
    if (!urlValue?.trim()) { (decay ? setDecayError : setStandardError)('Please enter a URL'); return; }
    const slug = customSlug.trim();
    if (isAuthenticated && slug && !decay && (!/^[a-zA-Z0-9_-]{1,64}$/.test(slug) || ['api','login','list','stats','shorten','_next','favicon.ico','icon'].includes(slug.toLowerCase()))) { setStandardError('Please enter a valid, available custom alias.'); return; }
    if (isAuthenticated && expiresAt && !decay && (isNaN(new Date(expiresAt).getTime()) || new Date(expiresAt) <= new Date())) { setStandardError('Expiration date/time must be a valid future date and time.'); return; }
    if (isAuthenticated && maxClicks && !decay && (!Number.isInteger(Number(maxClicks)) || Number(maxClicks) < 1)) { setStandardError('Maximum clicks must be a positive integer.'); return; }
    decay ? setDecayLoading(true) : setStandardLoading(true);
    try {
      const payload = { url: urlValue.trim() };
      if (decay) payload.decay = true;
      else if (isAuthenticated) { payload.private = isPrivate; if (slug) payload.customSlug = slug; if (expiresAt) payload.expiresAt = expiresAt; if (maxClicks) payload.maxClicks = Number(maxClicks); }
      const response = await fetch('/api/shorten', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) (decay ? setDecayError : setStandardError)(data.error || 'Failed to shorten URL');
      else { decay ? setDecayResult(data) : setStandardResult(data); decay ? setDecayUrl('') : setStandardUrl(''); setIsPrivate(false); setCustomSlug(''); setExpiresAt(''); setMaxClicks(''); fetchStats(); }
    } catch (_) { (decay ? setDecayError : setStandardError)('Network error. Please try again.'); }
    finally { decay ? setDecayLoading(false) : setStandardLoading(false); }
  };

  const anyLoading = standardLoading || decayLoading;
  const formatTimestamp = (value) => { try { return value ? new Date(value).toLocaleString() : ''; } catch (_) { return value; } };
  const copyToClipboard = async (text, e) => {
    e?.preventDefault();
    try { await navigator.clipboard.writeText(text); }
    catch (_) { const area = document.createElement('textarea'); area.value = text; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove(); }
    if (e?.currentTarget) { const button = e.currentTarget; const old = button.textContent; button.textContent = 'Copied!'; setTimeout(() => { button.textContent = old; }, 1200); }
  };

  const renderResult = (result) => result && <div className="result"><strong>Shortened URL</strong><br /><a href={result.shortUrl} target="_blank" rel="noopener noreferrer" className="short-url">{result.shortUrl}</a><br /><br /><strong>Original:</strong> {result.original}<br />{result.title && <><strong>Title:</strong> {result.title}<br /></>}<strong>Code:</strong> {result.id}<br /><strong>Visibility:</strong> {result.private ? 'Private' : 'Public'}<br />{result.decay && <><strong>Type:</strong> Decay (Burn After Reading)<br /></>}<span className="metadata">Created: {formatTimestamp(result.created)}</span>{result.qrCode && <div className="result-qr"><strong>QR Code</strong><img src={result.qrCode} alt={`QR code for ${result.shortUrl}`} /></div>}</div>;

  return <div className="home-centered">
    <div className="home-split">
      <div className="left-panel">
        <h1>URL Shortener for Intranet from the Trenches</h1>
        <p>A simple and efficient tool to shorten long URLs, making them easier to share and remember.</p>
        <p>Designed specifically for the Intranet from the Trenches community, this app helps you create compact links for internal resources, articles, blog posts, and other content.</p>
        <p>Enter a URL on the right to get your shortened link instantly. Results are stored securely for your use.</p>
      </div>
      <div className="right-panel">
        <form onSubmit={(e) => handleSubmit(e, standardUrl)} className={`prominent-form standard-form ${decayLoading ? 'greyed-out' : ''}`}>
          <strong className="form-section-title standard">Standard Link</strong>
          <label htmlFor="url-standard">Original URL</label>
          <input type="text" id="url-standard" value={standardUrl} onChange={(e) => setStandardUrl(e.target.value)} placeholder="https://example.com/very/long/path/to/your/resource" disabled={anyLoading} className="prominent-input" />
          <div className="advanced-box">
            <div className="advanced-header" onClick={() => !anyLoading && setAdvancedOpen(!advancedOpen)} role="button" tabIndex={0} aria-expanded={advancedOpen} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!anyLoading) setAdvancedOpen(!advancedOpen); } }}><span>Advanced Options {!isAuthenticated && ' (login required)'}</span><span className="toggle-icon">{advancedOpen ? '−' : '+'}</span></div>
            {advancedOpen && <div className="advanced-options">
              <div className={`option ${!isAuthenticated ? 'greyed' : ''}`}><label htmlFor="customSlug">Custom Alias (optional)</label><input type="text" id="customSlug" value={customSlug} onChange={(e) => setCustomSlug(e.target.value)} placeholder="my-campaign-link" disabled={anyLoading || !isAuthenticated} className="option-input" /><span className="metadata">Letters, numbers, - or _ only; 1-64 characters.</span></div>
              <div className={`option ${!isAuthenticated ? 'greyed' : ''}`}><label>Link Expiration (optional)</label><div className="expiration-fields"><div><label htmlFor="expiresAt" className="sub-label">Expires at</label><input type="datetime-local" id="expiresAt" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} disabled={anyLoading || !isAuthenticated} className="option-input" /></div><div><label htmlFor="maxClicks" className="sub-label">Max total clicks</label><input type="number" id="maxClicks" value={maxClicks} onChange={(e) => setMaxClicks(e.target.value)} min="1" disabled={anyLoading || !isAuthenticated} className="option-input" /></div></div></div>
              <div className={`option privacy-option ${!isAuthenticated ? 'greyed' : ''} ${isPrivate && isAuthenticated ? 'private-active' : ''}`}><label>Privacy (optional)</label><label className="checkbox-label"><input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} disabled={anyLoading || !isAuthenticated} /> Make it private</label><span className="metadata">The link will not show in public stats or recent lists.</span></div>
            </div>}
          </div>
          <button type="submit" disabled={anyLoading} className="prominent-button">{standardLoading ? 'Shortening...' : 'Shorten URL'}</button>
        </form>
        {standardError && <div className="error">{standardError}</div>}
        {renderResult(standardResult)}
      </div>
    </div>

    <form onSubmit={(e) => handleSubmit(e, decayUrl, true)} className={`prominent-form decay-form ${standardLoading ? 'greyed-out' : ''}`}>
      <strong className="form-section-title decay">🔥 Decay Link (Burn After Reading)</strong>
      <div className="decay-microcopy">Need to send passwords, tokens, or confidential links? Generate a single-use link. The moment it is clicked, it will be permanently erased from our servers.</div>
      <label htmlFor="url-decay">Confidential URL</label><input type="text" id="url-decay" value={decayUrl} onChange={(e) => setDecayUrl(e.target.value)} placeholder="Paste your confidential URL here..." disabled={anyLoading} className="prominent-input" />
      <button type="submit" disabled={anyLoading} className="prominent-button decay-cta">{decayLoading ? 'Creating Self-Destructing Link...' : 'Create Self-Destructing Link'}</button>
    </form>
    {decayError && <div className="error">{decayError}</div>}
    {renderResult(decayResult)}

    <div className="stats-row stats-teaser"><div className="stats-content"><strong>Community Stats (Public URLs only)</strong><div className="stats-cards"><div className="stat-card"><div className="stat-value">{stats.count}</div><div className="stat-label">Total Links Created</div></div><div className="stat-card"><div className="stat-value">{stats.uniqueDomains}</div><div className="stat-label">Unique Domains</div></div><div className="stat-card"><div className="stat-value">{stats.thisMonth}</div><div className="stat-label">Created This Month</div></div><div className="stat-card"><div className="stat-value">{stats.totalClicks}</div><div className="stat-label">Total Clicks (All URLs)</div></div></div></div></div>

    <div className="stats-row recent-section"><div className="stats-content"><strong>Recent Public Shortened URLs</strong>{statsLoading ? <span className="metadata">Loading recent links...</span> : stats.recent.length ? <div className="recent-list">{stats.recent.map((item) => <div key={item.id} className="recent-item"><div className="recent-item-layout"><div className="recent-qr-wrap">{item.qrCode ? <img src={item.qrCode} alt={`QR code for ${item.shortUrl}`} className="recent-qr" /> : <div className="recent-qr-placeholder">QR unavailable</div>}</div><div className="recent-details">{item.title && <div className="recent-title">{item.title}</div>}<div className="recent-meta"><span className="source-arrow">→</span> <span className="original-link">{item.original}</span><span className="metadata"> • {formatTimestamp(item.created)}</span></div><a href={item.shortUrl} target="_blank" rel="noopener noreferrer" className="recent-short-url">{item.shortUrl}</a><div className="recent-actions"><a href={item.shortUrl} target="_blank" rel="noopener noreferrer" className="recent-action-button">Open</a><button type="button" onClick={(e) => copyToClipboard(item.shortUrl, e)} className="recent-action-button copy-action">Copy</button></div></div></div></div>)}</div> : <span className="metadata">No recent URLs yet. Shorten one to see it here!</span>}</div></div>
  </div>;
}
