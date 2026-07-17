'use client';

import { useState, useEffect } from 'react';

export default function ListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUrls = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/urls');
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = '/login';
          return;
        }
        setError(data.error || 'Failed to load URLs');
      } else {
        setItems(data.items || []);
      }
    } catch (err) {
      setError('Failed to fetch URLs. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2>All Shortened URLs</h2>
      </div>
      
      <p>
        Below is a list of all URLs that have been shortened. Data is persisted in the local file system.
      </p>

      <button 
        onClick={fetchUrls} 
        disabled={loading} 
        className="secondary"
        style={{ marginBottom: '16px' }}
      >
        {loading ? 'Refreshing...' : 'Refresh List'}
      </button>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {loading && !error && (
        <p className="metadata">Loading...</p>
      )}

      {!loading && items.length === 0 && !error && (
        <p>
          No URLs have been shortened yet. Go to the <a href="/">Shorten page</a> to create one.
        </p>
      )}

      {!loading && items.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Short Code</th>
              <th>Shortened URL</th>
              <th>Original URL</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td><code className="short-url">{item.id}</code></td>
                <td>
                  <a href={item.shortUrl} target="_blank" rel="noopener noreferrer" className="short-url">
                    {item.shortUrl}
                  </a>
                </td>
                <td style={{ wordBreak: 'break-all' }}>
                  <a href={item.original} target="_blank" rel="noopener noreferrer">
                    {item.original}
                  </a>
                </td>
                <td className="metadata">{new Date(item.created).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="metadata" style={{ marginTop: '16px' }}>
        Total entries: {items.length}
      </div>
    </>
  );
}
