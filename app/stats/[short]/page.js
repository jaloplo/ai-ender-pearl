'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function StatsPage() {
  const params = useParams();
  const short = params?.short;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sorting for Access Log: column and direction
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('desc'); // default newest first for logs

  useEffect(() => {
    if (!short) {
      setError('No short code provided');
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/stats/${short}`);
        const result = await response.json();

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            window.location.href = '/login';
            return;
          }
          setError(result.error || 'Failed to load stats');
        } else {
          setData(result);
        }
      } catch (err) {
        setError('Failed to fetch stats. Is the server running?');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [short]);

  // Handle column header click for sorting (alternating order)
  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      // sensible defaults
      setSortDirection(columnKey === 'timestamp' ? 'desc' : 'asc');
    }
  };

  const getSortIndicator = (columnKey) => {
    if (sortColumn !== columnKey) return '';
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  if (loading) {
    return <p className="metadata">Loading stats...</p>;
  }

  if (error) {
    return (
      <>
        <h2>Stats Error</h2>
        <div className="error">{error}</div>
        <p><a href="/list">Back to list</a></p>
      </>
    );
  }

  if (!data) {
    return <p>No data.</p>;
  }

  const { id, original, created, accessCount, stats, title, expiresAt, maxClicks } = data;

  // Display title or original URL in the header
  const displayName = title || original;

  // Sort the stats for the log table
  let sortedStats = [...(stats || [])];
  if (sortColumn) {
    sortedStats.sort((a, b) => {
      let valA, valB;

      switch (sortColumn) {
        case 'index':
          // index is derived, use original order fallback
          return 0;
        case 'timestamp':
          valA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          valB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          break;
        case 'ip':
          valA = a.ip || '';
          valB = b.ip || '';
          break;
        case 'userAgent':
          valA = a.userAgent || '';
          valB = b.userAgent || '';
          break;
        case 'referer':
          valA = a.referer || '';
          valB = b.referer || '';
          break;
        default:
          return 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Use similar style to homepage stats: stat cards for properties
  return (
    <>
      <h2>Access Statistics for {displayName}</h2>

      {/* Properties shown in similar style to home page stats cards */}
      <div className="stats-row stats-teaser" style={{ marginBottom: '24px' }}>
        <div className="stats-content">
          <strong>URL Details</strong>
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-value">{accessCount}</div>
              <div className="stat-label">Access Count</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: '15px', wordBreak: 'break-all' }}>
                <code className="short-url">{id}</code>
              </div>
              <div className="stat-label">Short Code</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: '13px', wordBreak: 'break-all' }}>
                <a href={original} target="_blank" rel="noopener noreferrer">{original}</a>
              </div>
              <div className="stat-label">Original URL</div>
            </div>
            {title && (
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '14px', wordBreak: 'break-word' }}>
                  {title}
                </div>
                <div className="stat-label">Page Title</div>
              </div>
            )}
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: '14px' }}>
                {new Date(created).toLocaleString()}
              </div>
              <div className="stat-label">Created</div>
            </div>
            {expiresAt && (
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '14px', color: new Date(expiresAt) < new Date() ? '#991b1b' : 'inherit' }}>
                  {new Date(expiresAt).toLocaleString()}
                </div>
                <div className="stat-label">Expires At</div>
              </div>
            )}
            {maxClicks != null && (
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '14px' }}>
                  {accessCount} / {maxClicks}
                  {accessCount >= Number(maxClicks) && ' (reached)'}
                </div>
                <div className="stat-label">Max Clicks</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <h3>Access Log</h3>

      {accessCount === 0 && (
        <p className="metadata">No accesses recorded yet for this shortened URL.</p>
      )}

      {accessCount > 0 && (
        <table>
          <thead>
            <tr>
              <th 
                onClick={() => handleSort('index')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="Click to sort"
              >
                #{getSortIndicator('index')}
              </th>
              <th 
                onClick={() => handleSort('timestamp')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="Click to sort (alternates asc/desc)"
              >
                Date &amp; Time{getSortIndicator('timestamp')}
              </th>
              <th 
                onClick={() => handleSort('ip')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="Click to sort (alternates asc/desc)"
              >
                IP Address{getSortIndicator('ip')}
              </th>
              <th 
                onClick={() => handleSort('userAgent')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="Click to sort (alternates asc/desc)"
              >
                Web Browser (User-Agent){getSortIndicator('userAgent')}
              </th>
              <th 
                onClick={() => handleSort('referer')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="Click to sort (alternates asc/desc)"
              >
                Referer{getSortIndicator('referer')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStats.map((stat, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td className="metadata">{new Date(stat.timestamp).toLocaleString()}</td>
                <td><code>{stat.ip}</code></td>
                <td style={{ wordBreak: 'break-all', fontSize: '12px' }}>{stat.userAgent}</td>
                <td style={{ wordBreak: 'break-all', fontSize: '12px' }}>
                  {stat.referer ? (
                    <a href={stat.referer} target="_blank" rel="noopener noreferrer">{stat.referer}</a>
                  ) : (
                    <span className="metadata">(none)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: '24px' }}>
        <a href="/list" className="btn-tertiary">← Back to URL List</a>
        {' | '}
        <a href={`/${id}`} target="_blank" rel="noopener noreferrer">Test redirect</a>
      </div>
    </>
  );
}
