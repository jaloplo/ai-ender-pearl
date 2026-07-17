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
          // Should not happen due to middleware, but fallback
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

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>All Shortened URLs</h2>
        <button onClick={handleLogout} style={{ backgroundColor: '#666666', fontSize: '12px', padding: '4px 8px' }}>
          Logout
        </button>
      </div>
      <p style={{ marginBottom: '15px' }}>
        Below is a list of all URLs that have been shortened. Data is persisted in the local file system.
      </p>

      <button onClick={fetchUrls} disabled={loading} style={{ marginBottom: '15px' }}>
        {loading ? 'Refreshing...' : 'Refresh List'}
      </button>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {loading && !error && (
        <p>Loading...</p>
      )}

      {!loading && items.length === 0 && !error && (
        <p>No URLs have been shortened yet. Go to the <a href="/">Shorten page</a> to create one.</p>
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
                <td><code>{item.id}</code></td>
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
                <td>{new Date(item.created).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px' }}>
        Total entries: {items.length}
      </div>
    </>
  );
}
