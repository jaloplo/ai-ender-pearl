'use client';

import { useState } from 'react';

export default function ShortenPage() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        body: JSON.stringify({ url: url.trim() }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to shorten URL');
      } else {
        setResult(data);
        setUrl('');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero Section with Value Proposition - Feature 1 */}
      <section className="hero">
        <h1>Shorten Your Links Instantly</h1>
        <p className="hero-tagline">
          Transform long, unwieldy URLs into clean, shareable links. 
          Perfect for internal productivity tools, quick resource sharing, 
          and streamlined communication across your team.
        </p>
        
        {/* Optional feature highlights */}
        <div className="hero-features">
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <span>Instant Results</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🔒</span>
            <span>Secure &amp; Private</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📋</span>
            <span>Easy to Manage</span>
          </div>
        </div>
      </section>

      {/* Prominent URL Input Section - Feature 2 */}
      <section className="shorten-section">
        <h2>Shorten a URL</h2>
        <p>
          Enter a long URL below to generate a shortened version to use.
        </p>
        
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
            <span className="metadata">Created: {new Date(result.created).toLocaleString()}</span>
          </div>
        )}

        <div className="metadata" style={{ marginTop: '32px' }}>
        </div>
      </section>

      {/* Trust Signals and Feature Highlights - "Why Use Ender Pearl?" */}
      <section className="trust-signals">
        <h2>Why Use Ender Pearl?</h2>
        <p className="trust-intro">
          Built for teams that value security, speed, and simplicity. 
          No external dependencies, full control over your links.
        </p>
        <div className="highlights">
          <div className="highlight">
            <span className="highlight-icon">🔒</span>
            <div className="highlight-content">
              <strong>Secure internal access</strong>
              <span>Private by design. List and analytics require authentication.</span>
            </div>
          </div>
          <div className="highlight">
            <span className="highlight-icon">⚡</span>
            <div className="highlight-content">
              <strong>Instant 302 redirects</strong>
              <span>Fast, reliable redirects with no tracking overhead for users.</span>
            </div>
          </div>
          <div className="highlight">
            <span className="highlight-icon">📊</span>
            <div className="highlight-content">
              <strong>Trackable analytics</strong>
              <span>Optional access logs and stats for admins (no user data sold).</span>
            </div>
          </div>
          <div className="highlight">
            <span className="highlight-icon">🏢</span>
            <div className="highlight-content">
              <strong>Internal focus</strong>
              <span>Designed for intranet and corporate environments. Retro UI that fits.</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
