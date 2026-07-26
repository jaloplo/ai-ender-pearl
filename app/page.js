'use client';

import { useState, useEffect } from 'react';

export default function ShortenPage() {
  const [url, setUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({ count: 0, recent: [], uniqueDomains: 0, thisMonth: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim(), private: isPrivate }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to shorten URL');
      } else {
        setResult(data);
        setUrl('');
        setIsPrivate(false); // reset to default public
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
  }, []);

  const formatTimestamp = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
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

            {/* Privacy selection: checkbox, default unchecked = public */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  disabled={loading}
                  style={{ marginRight: '8px' }}
                />
                Make private (not shown in public stats or recent lists)
              </label>
              <span className="metadata" style={{ fontSize: '12px', marginLeft: '24px', display: 'block' }}>
                Default: public
              </span>
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
              <strong>Code:</strong> {result.id}<br />
              <strong>Visibility:</strong> {result.private ? 'Private' : 'Public'}<br />
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

      {/* Feature: Anonymous Usage Stats Dashboard Teaser - visual cards below stats-row */}
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
                  <a 
                    href={item.shortUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="short-url"
                  >
                    {item.shortUrl}
                  </a>
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
