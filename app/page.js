'use client';

import { useState, useEffect } from 'react';

export default function ShortenPage() {
  const [url, setUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxClicks, setMaxClicks] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({ count: 0, recent: [], uniqueDomains: 0, thisMonth: 0, totalClicks: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/status');
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(data.authenticated === true);
      }
    } catch (e) {
      setIsAuthenticated(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Optional client-side slug validation (server will enforce too) - only relevant if authenticated
    const trimmedSlug = customSlug.trim();
    if (isAuthenticated && trimmedSlug) {
      if (trimmedSlug.length < 1 || trimmedSlug.length > 64) {
        setError('Custom alias must be 1-64 characters.');
        return;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedSlug)) {
        setError('Custom alias can only contain letters, numbers, hyphens (-) and underscores (_).');
        return;
      }
      const reserved = ['api', 'login', 'list', 'stats', 'shorten', '_next', 'favicon.ico', 'icon'];
      if (reserved.includes(trimmedSlug.toLowerCase())) {
        setError('This alias is reserved. Please choose another.');
        return;
      }
    }

    // Client-side validation for expiration - only if authenticated
    if (isAuthenticated && expiresAt) {
      const expDate = new Date(expiresAt);
      if (isNaN(expDate.getTime()) || expDate <= new Date()) {
        setError('Expiration date/time must be a valid future date and time.');
        return;
      }
    }
    if (isAuthenticated && maxClicks && (isNaN(parseInt(maxClicks, 10)) || parseInt(maxClicks, 10) < 1)) {
      setError('Maximum clicks must be a positive integer.');
      return;
    }
    
    setLoading(true);
    
    try {
      const payload = { url: url.trim() };
      if (isAuthenticated) {
        payload.private = isPrivate;
        if (trimmedSlug) {
          payload.customSlug = trimmedSlug;
        }
        if (expiresAt) {
          payload.expiresAt = expiresAt; // datetime-local format is ISO-like, server will normalize
        }
        if (maxClicks) {
          payload.maxClicks = parseInt(maxClicks, 10);
        }
      }

      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to shorten URL');
      } else {
        setResult(data);
        setUrl('');
        setIsPrivate(false); // reset to default public
        setCustomSlug(''); // reset alias
        setExpiresAt('');
        setMaxClicks('');
        // Refresh stats after successful shorten
        fetchStats();
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/public-stats');
      if (res.ok) {
        const data = await res.json();
        setStats({
          count: data.count || 0,
          recent: data.recent || [],
          uniqueDomains: data.uniqueDomains || 0,
          thisMonth: data.thisMonth || 0,
          totalClicks: data.totalClicks || 0,
        });
      }
    } catch (e) {
      // keep previous or default
    }
  };

  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true);
      await fetchStats();
      setStatsLoading(false);
    };
    loadStats();
    checkAuthStatus();
  }, []);

  const formatTimestamp = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const copyToClipboard = async (text, e) => {
    if (e) e.preventDefault();
    try {
      await navigator.clipboard.writeText(text);
      // Optional: could add a temporary "Copied!" toast, but keep simple for now
      const origText = e?.target?.textContent;
      if (e && e.target) {
        e.target.textContent = 'Copied!';
        setTimeout(() => {
          if (e.target) e.target.textContent = origText || 'Copy';
        }, 1200);
      }
    } catch (err) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (_) {}
    }
  };

  // Handler for privacy checkbox to allow color change
  const handlePrivateChange = (e) => {
    setIsPrivate(e.target.checked);
  };

  // Helper to format expiration for display in result
  const formatExpiration = (exp) => {
    if (!exp) return null;
    try {
      return new Date(exp).toLocaleString();
    } catch {
      return exp;
    }
  };

  return (
    <div className="home-centered">
      <div className="home-split">
        {/* Left side: Name, description and purpose */}
        <div className="left-panel">
          <h1>URL Shortener for Intranet from the Trenches</h1>
          <p>
            A simple and efficient tool to shorten long URLs, making them easier to share and remember.
          </p>
          <p>
            Designed specifically for the Intranet from the Trenches community, this app helps you create compact links for internal resources, articles, blog posts, and other content. 
            Perfect for quick sharing within our intranet and Substack readers without cluttering messages or documents.
          </p>
          <p>
            Enter a URL on the right to get your shortened link instantly. Results are stored securely for your use.
          </p>
        </div>

        {/* Right side: Textbox, button, and shortening result */}
        <div className="right-panel">
          <form onSubmit={handleSubmit} className="prominent-form">
            <label htmlFor="url">Original URL</label>
            <input
              type="text"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/very/long/path/to/your/resource"
              disabled={loading}
              className="prominent-input"
            />

            {/* Collapsible Advanced Options box grouping: Make private, Custom Alias and Link Expiration.
                The box header is always visible. Content expands/collapses on click.
                Options shown for all but greyed/disabled for anonymous (features never sent for anon). */}
            <div className="advanced-box">
              <div 
                className="advanced-header"
                onClick={() => setAdvancedOpen(!advancedOpen)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setAdvancedOpen(!advancedOpen);
                  }
                }}
                aria-expanded={advancedOpen}
              >
                <span>Advanced Options {!isAuthenticated && ' (login required)'}</span>
                <span className="toggle-icon">{advancedOpen ? '−' : '+'}</span>
              </div>
              {advancedOpen && (
                <div className="advanced-options">
                  {/* Custom Alias / Slug input */}
                  <div className={`option ${!isAuthenticated ? 'greyed' : ''}`}>
                    <label htmlFor="customSlug">Custom Alias (optional)</label>
                    <input
                      type="text"
                      id="customSlug"
                      value={customSlug}
                      onChange={(e) => setCustomSlug(e.target.value)}
                      placeholder="my-campaign-link or product2025"
                      disabled={loading || !isAuthenticated}
                      className="option-input"
                    />
                    <span className="metadata" style={{ fontSize: '11px', display: 'block' }}>
                      Use letters, numbers, - or _ only.
                    </span>
                    <span className="metadata" style={{ fontSize: '11px', display: 'block', marginTop: '6px' }}>
                      1-64 chars. Replaces random code. Must be unique.
                    </span>
                    <span className="metadata" style={{ fontSize: '11px', display: 'block', marginTop: '6px' }}>
                      Replaces random code.
                    </span>
                    <span className="metadata" style={{ fontSize: '11px', display: 'block', marginTop: '6px' }}>
                      Must be unique.
                    </span>
                  </div>

                  {/* Link Expiration controls */}
                  <div className={`option ${!isAuthenticated ? 'greyed' : ''}`}>
                    <label>Link Expiration (optional)</label>
                    <div className="expiration-fields">
                      <div className="exp-field">
                        <label htmlFor="expiresAt" className="sub-label">
                          Expires at (date &amp; time)
                        </label>
                        <input
                          type="datetime-local"
                          id="expiresAt"
                          value={expiresAt}
                          onChange={(e) => setExpiresAt(e.target.value)}
                          disabled={loading || !isAuthenticated}
                          className="option-input"
                        />
                        <span className="metadata" style={{ fontSize: '11px' }}>Link will stop working after this date/time.</span>
                      </div>
                      <div className="exp-field">
                        <label htmlFor="maxClicks" className="sub-label">
                          Max total clicks
                        </label>
                        <input
                          type="number"
                          id="maxClicks"
                          value={maxClicks}
                          onChange={(e) => setMaxClicks(e.target.value)}
                          min="1"
                          placeholder="e.g. 100"
                          disabled={loading || !isAuthenticated}
                          className="option-input"
                        />
                        <span className="metadata" style={{ fontSize: '11px' }}>After this many clicks, link deactivates.</span>
                      </div>
                    </div>
                    <span className="metadata" style={{ fontSize: '11px', display: 'block', marginTop: '6px' }}>
                      You can set a date, a click limit, or both. Once reached, the link shows an expiration message instead of redirecting.
                    </span>
                  </div>

                  {/* Privacy selection: checkbox, default unchecked = public. Background color changes when private (only for auth users) */}
                  <div 
                    className={`option privacy-option ${!isAuthenticated ? 'greyed' : ''} ${isPrivate && isAuthenticated ? 'private-active' : ''}`}
                  >
                    <label>Privacy (optional)</label>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', cursor: isAuthenticated ? 'pointer' : 'default' }}>
                      <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={handlePrivateChange}
                        disabled={loading || !isAuthenticated}
                        style={{ marginRight: '8px' }}
                      />
                      Make it private
                    </label>
                    <span className="metadata" style={{ fontSize: '11px', display: 'block', marginTop: '6px' }}>
                      Public is the default value.
                    </span>
                    <span className="metadata" style={{ fontSize: '11px', display: 'block', marginTop: '6px' }}>
                      The link will not show in public stats or recent lists.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="prominent-button">
              {loading ? 'Shortening...' : 'Shorten URL'}
            </button>
          </form>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          {result && (
            <div className="result">
              <strong>Shortened URL</strong><br />
              <a href={result.shortUrl} target="_blank" rel="noopener noreferrer" className="short-url">
                {result.shortUrl}
              </a>
              <br /><br />
              <strong>Original:</strong> {result.original}<br />
              {result.title && <><strong>Title:</strong> {result.title}<br /></>}
              <strong>Code:</strong> {result.id}<br />
              <strong>Visibility:</strong> {result.private ? 'Private' : 'Public'}<br />
              {result.expiresAt && (
                <><strong>Expires At:</strong> {formatExpiration(result.expiresAt)}<br /></>
              )}
              {result.maxClicks != null && (
                <><strong>Max Clicks:</strong> {result.maxClicks}<br /></>
              )}
              <span className="metadata">Created: {new Date(result.created).toLocaleString()}</span>

              {/* QR Code display - shown together with shortened URL. Larger size to showcase maximized logo. */}
              {result.qrCode && (
                <div style={{ marginTop: '16px' }}>
                  <strong>QR Code</strong>
                  <div style={{ marginTop: '8px' }}>
                    <img 
                      src={result.qrCode} 
                      alt={`QR code for ${result.shortUrl}`} 
                      style={{ 
                        width: '240px', 
                        height: '240px', 
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: '4px',
                        background: '#fff'
                      }} 
                    />
                  </div>
                  <span className="metadata" style={{ fontSize: '11px' }}>
                    Scan to open • Logo integrated (brand logo, maximized size)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feature: Anonymous Usage Stats Dashboard Teaser - visual cards below stats-row. Now includes Total Clicks box */}
      <div className="stats-row stats-teaser">
        <div className="stats-content">
          <strong>Community Stats (Public URLs only)</strong>
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-value">{stats.count}</div>
              <div className="stat-label">Total Links Created</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.uniqueDomains}</div>
              <div className="stat-label">Unique Domains</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.thisMonth}</div>
              <div className="stat-label">Created This Month</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalClicks}</div>
              <div className="stat-label">Total Clicks (All URLs)</div>
            </div>
          </div>
          {stats.count === 0 && (
            <span className="metadata">No data yet — start shortening to populate stats!</span>
          )}
        </div>
      </div>

      {/* Feature: Recent Public Shortened URLs - new section below stats-row using existing CSS classes for consistency */}
      <div className="stats-row recent-section">
        <div className="stats-content">
          <strong>Recent Public Shortened URLs</strong>
          {statsLoading ? (
            <span className="metadata">Loading recent links...</span>
          ) : stats.recent && stats.recent.length > 0 ? (
            <div className="recent-list">
              {stats.recent.map((item, index) => (
                <div key={index} className="recent-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <a 
                      href={item.shortUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="short-url"
                    >
                      {item.shortUrl}
                    </a>
                    <button
                      type="button"
                      onClick={(e) => copyToClipboard(item.shortUrl, e)}
                      className="secondary"
                      style={{ 
                        padding: '2px 8px', 
                        fontSize: '11px', 
                        marginLeft: '4px',
                        minWidth: 'auto',
                        lineHeight: '1.2'
                      }}
                      title="Copy shortened URL to clipboard"
                    >
                      Copy
                    </button>
                  </div>
                  {item.title && (
                    <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '2px', color: 'var(--color-text-primary)' }}>
                      {item.title}
                    </div>
                  )}
                  <span className="recent-meta">
                    {' → '}
                    <span className="original-link">{item.original}</span>
                    <span className="metadata"> • {formatTimestamp(item.created)}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="metadata">No recent URLs yet. Shorten one to see it here!</span>
          )}
        </div>
      </div>
    </div>
  );
}
