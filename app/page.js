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
    <div className="home-centered">
      <div className="home-split">
        {/* Left side: Name, description and purpose */}
        <div className="left-panel">
          <h1>URL Shortener for 'Intranet from the Trenches'</h1>
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
        </div>
      </div>
    </div>
  );
}
