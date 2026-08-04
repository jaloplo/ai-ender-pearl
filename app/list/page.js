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
  const [updatingId, setUpdatingId] = useState(null);

  // Sorting state: column key and direction ('asc' | 'desc')
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Column visibility: all existing columns selectable
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState([
    'shortCode', 'shortenedUrl', 'originalUrl', 'title', 'created', 'visibility', 'accesses', 'actions'
  ]);

  const CACHE_KEY = 'urlShortenerCache';
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  // All available columns (existing ones + title for completeness)
  const allColumns = [
    { key: 'shortCode', label: 'Short Code' },
    { key: 'shortenedUrl', label: 'Shortened URL' },
    { key: 'originalUrl', label: 'Original URL' },
    { key: 'title', label: 'Title' },
    { key: 'created', label: 'Created' },
    { key: 'visibility', label: 'Visibility' },
    { key: 'accesses', label: 'Accesses' },
    { key: 'actions', label: 'Actions' },
  ];

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

  // Handle column header click for sorting (alternating order)
  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
    setCurrentPage(1); // reset to first page on new sort
  };

  // Get sort indicator
  const getSortIndicator = (columnKey) => {
    if (sortColumn !== columnKey) return '';
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  // Toggle a column visibility
  const toggleColumn = (key) => {
    setVisibleColumns(prev => {
      if (prev.includes(key)) {
        // Prevent hiding all columns
        if (prev.length === 1) return prev;
        return prev.filter(k => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  // Clamp current page if it exceeds total after filter or data change
  let filteredItems = items.filter(item =>
    (item.original || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Apply sorting if active
  if (sortColumn) {
    filteredItems = [...filteredItems].sort((a, b) => {
      let valA, valB;

      switch (sortColumn) {
        case 'shortCode':
          valA = a.id || '';
          valB = b.id || '';
          break;
        case 'shortenedUrl':
          valA = a.shortUrl || '';
          valB = b.shortUrl || '';
          break;
        case 'originalUrl':
          valA = a.original || '';
          valB = b.original || '';
          break;
        case 'title':
          valA = a.title || '';
          valB = b.title || '';
          break;
        case 'created':
          valA = a.created ? new Date(a.created).getTime() : 0;
          valB = b.created ? new Date(b.created).getTime() : 0;
          break;
        case 'visibility':
          valA = a.private ? 1 : 0;
          valB = b.private ? 1 : 0;
          break;
        case 'accesses':
          valA = a.accessCount ?? 0;
          valB = b.accessCount ?? 0;
          break;
        default:
          return 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

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

  const handleToggleVisibility = async (item) => {
    setUpdatingId(item.id);
    setError('');

    try {
      const newPrivate = !item.private;

      const response = await fetch(`/api/urls/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ private: newPrivate }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = '/login';
          return;
        }
        setError(data.error || 'Failed to update visibility');
      } else {
        // Update local state immediately
        setItems(prevItems =>
          prevItems.map(i =>
            i.id === item.id ? { ...i, private: data.private } : i
          )
        );

        // Also update the browser cache to keep it in sync
        const cachedStr = localStorage.getItem(CACHE_KEY);
        if (cachedStr) {
          try {
            const cached = JSON.parse(cachedStr);
            if (cached.items) {
              cached.items = cached.items.map(i =>
                i.id === item.id ? { ...i, private: data.private } : i
              );
              localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
            }
          } catch (e) {
            // ignore cache parse errors
          }
        }
      }
    } catch (err) {
      setError('Failed to update visibility. Is the server running?');
    } finally {
      setUpdatingId(null);
    }
  };

  // Simple inline SVG icons (interface style from flaticon-like: clean line icons)
  const StatsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );

  const PrivacyIcon = ({ isPrivate }) => (
    isPrivate ? (
      // Lock icon (private)
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ) : (
      // Unlock icon (public)
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      </svg>
    )
  );

  // Render cell content based on column
  const renderCell = (item, columnKey) => {
    switch (columnKey) {
      case 'shortCode':
        return <code className="short-url">{item.id}</code>;
      case 'shortenedUrl':
        return (
          <a href={item.shortUrl} target="_blank" rel="noopener noreferrer" className="short-url">
            {item.shortUrl}
          </a>
        );
      case 'originalUrl':
        return (
          <a href={item.original} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
            {item.original}
          </a>
        );
      case 'title':
        return item.title ? (
          <span style={{ fontSize: '13px' }}>{item.title}</span>
        ) : (
          <span className="metadata">(no title)</span>
        );
      case 'created':
        return <span className="metadata">{new Date(item.created).toLocaleString()}</span>;
      case 'visibility':
        return (
          <span style={{
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '12px',
            backgroundColor: item.private ? '#fee2e2' : '#dcfce7',
            color: item.private ? '#991b1b' : '#166534',
            border: `1px solid ${item.private ? '#fecaca' : '#bbf7d0'}`
          }}>
            {item.private ? 'Private' : 'Public'}
          </span>
        );
      case 'accesses':
        return item.accessCount ?? 0;
      case 'actions':
        return (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <a 
              href={`/stats/${item.id}`} 
              className="action-btn" 
              title="View Stats"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 6px' }}
            >
              <StatsIcon />
            </a>
            <button
              onClick={() => handleToggleVisibility(item)}
              disabled={updatingId === item.id || loading}
              className="action-btn secondary"
              title={item.private ? 'Make Public' : 'Make Private'}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 6px' }}
            >
              <PrivacyIcon isPrivate={item.private} />
            </button>
          </div>
        );
      default:
        return '';
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2>All Shortened URLs</h2>
        <button
          onClick={() => setShowColumnSelector(!showColumnSelector)}
          className="secondary"
          style={{ padding: '4px 10px', fontSize: '13px' }}
          aria-expanded={showColumnSelector}
        >
          Select Columns
        </button>
      </div>

      {/* Column selector dropdown */}
      {showColumnSelector && (
        <div 
          style={{ 
            border: '1px solid var(--color-border-subtle)', 
            background: 'var(--color-bg-primary)', 
            padding: '12px', 
            marginBottom: '12px',
            borderRadius: '4px',
            maxWidth: '320px'
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Choose columns to display:</div>
          {allColumns.map(col => (
            <label key={col.key} style={{ display: 'block', fontSize: '13px', marginBottom: '4px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={visibleColumns.includes(col.key)}
                onChange={() => toggleColumn(col.key)}
                style={{ marginRight: '6px' }}
              />
              {col.label}
            </label>
          ))}
          <button 
            onClick={() => setShowColumnSelector(false)} 
            className="secondary" 
            style={{ marginTop: '8px', fontSize: '12px', padding: '2px 8px' }}
          >
            Done
          </button>
        </div>
      )}

      <p>
        Below is a list of all URLs that have been shortened. Data is persisted using Cosmos DB (MongoDB API) or local file system.
        Results are cached in your browser for faster loading. Click Stats to view detailed access logs (admin only).
        Private URLs are not shown in public stats or recent lists.
      </p>

      {/* Search box for original URLs (and title) */}
      <div style={{ marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="Search original URLs or titles..."
          value={searchTerm}
          onChange={handleSearchChange}
          style={{ width: '320px', maxWidth: '100%' }}
          aria-label="Search original URLs or titles"
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
                {allColumns
                  .filter(col => visibleColumns.includes(col.key))
                  .map(col => (
                    <th 
                      key={col.key}
                      onClick={() => col.key !== 'actions' && handleSort(col.key)}
                      style={{ 
                        cursor: col.key !== 'actions' ? 'pointer' : 'default',
                        userSelect: 'none'
                      }}
                      title={col.key !== 'actions' ? 'Click to sort (alternates asc/desc)' : ''}
                    >
                      {col.label}{getSortIndicator(col.key)}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.id}>
                  {allColumns
                    .filter(col => visibleColumns.includes(col.key))
                    .map(col => (
                      <td key={col.key}>
                        {renderCell(item, col.key)}
                      </td>
                    ))}
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
