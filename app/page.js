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
      <h2>Shorten a URL</h2>
      <p>
        Enter a long URL below to generate a shortened version for internal use.
      </p>
      
      <form onSubmit={handleSubmit}>
        <label htmlFor="url">Original URL</label>
        <input
          type="text"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/very/long/path"
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
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
        <strong>Note:</strong> Shortened URLs are stored locally in <code>data/urls.json</code>.
        Use the List page to view all shortened links.
      </div>
    </>
  );
}
