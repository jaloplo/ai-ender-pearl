'use client';

import { useState, useEffect } from 'react';

export default function ListPage() {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const CACHE_KEY = 'urlShortenerCache';
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  const fetchUrls = async (forceRefresh = false) => {
    setLoading(true);
    setError('');

    try {
      // Check browser cache first (unless forcing refresh)
      if (!forceRefresh) {
        const cachedStr = localStorage.getItem(CACHE_KEY);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
            setItems(cached.items || []);
            setLastUpdated(new Date(cached.timestamp));
            setLoading(false);
            return;
          }
        }
      }

      const response = await fetch('/api/urls');
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = '/login';
          return;
        }
        setError(data.error || 'Failed to load URLs');
      } else {
        const fetchedItems = data.items || [];
        setItems(fetchedItems);
        const now = new Date();
        setLastUpdated(now);

        // Cache in browser for faster subsequent loads
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: now.getTime(),
          items: fetchedItems
        }));
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

  // Clamp current page if it exceeds total after filter or data change
  const filteredItems = items.filter(item =>
    item.original.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    const safePage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(safePage);
  };

  const clearCacheAndRefresh = () => {
    localStorage.removeItem(CACHE_KEY);
    fetchUrls(true);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2>All Shortened URLs</h2>
      </div>

      <p>
        Below is a list of all URLs that have been shortened. Data is persisted using Cosmos DB (MongoDB API) or local file system.
        Results are cached in your browser for faster loading.
      </p>

      {/* Search box for original URLs */}
      <div style={{ marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="Search original URLs..."
          value={searchTerm}
          onChange={handleSearchChange}
          style={{ width: '320px', maxWidth: '100%' }}
          aria-label="Search original URLs"
        />
      </div>

      {/* Page size options and actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ marginRight: '6px', fontSize: '14px' }}>Items per page:</label>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            style={{ padding: '4px 8px' }}
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>

        <button
          onClick={() => fetchUrls(true)}
          disabled={loading}
          className="secondary"
        >
          {loading ? 'Refreshing...' : 'Refresh List'}
        </button>

        <button
          onClick={clearCacheAndRefresh}
          disabled={loading}
          className="secondary"
        >
          Clear Cache &amp; Refresh
        </button>
      </div>

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

      {!loading && items.length > 0 && filteredItems.length === 0 && searchTerm && (
        <p className="metadata">
          No matches found for &quot;{searchTerm}&quot;. Try a different search term.
        </p>
      )}

      {!loading && paginatedItems.length > 0 && (
        <>
          <div className="metadata" style={{ marginBottom: '8px' }}>
            Showing {startIndex + 1}–{Math.min(startIndex + pageSize, totalItems)} of {totalItems}
            {searchTerm ? ` (filtered from ${items.length} total)` : ''}
            {lastUpdated && ` • Cached at ${lastUpdated.toLocaleTimeString()}`}
          </div>

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
              {paginatedItems.map((item) => (
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

          {/* Paging options */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', marginBottom: '16px' }}>
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="secondary"
                style={{ padding: '4px 10px', fontSize: '13px' }}
                aria-label="First page"
              >
                «
              </button>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="secondary"
                style={{ padding: '4px 10px', fontSize: '13px' }}
                aria-label="Previous page"
              >
                ‹
              </button>

              <span className="metadata" style={{ margin: '0 8px' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="secondary"
                style={{ padding: '4px 10px', fontSize: '13px' }}
                aria-label="Next page"
              >
                ›
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="secondary"
                style={{ padding: '4px 10px', fontSize: '13px' }}
                aria-label="Last page"
              >
                »
              </button>
            </div>
          )}
        </>
      )}

      <div className="metadata" style={{ marginTop: '16px' }}>
        Total entries in cache: {items.length}
        {searchTerm && ` • ${filteredItems.length} match${filteredItems.length === 1 ? '' : 'es'} for search`}
      </div>
    </>
  );
}
