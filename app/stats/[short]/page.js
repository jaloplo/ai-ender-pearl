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

  // For QR download/copy feedback
  const [copySuccess, setCopySuccess] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateSuccess, setRegenerateSuccess] = useState(false);

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

  // Bot / Human badge (same visual language as list page)
  const BotBadge = ({ isBot }) => (
    isBot ? (
      <span style={{
        padding: '1px 6px',
        borderRadius: '3px',
        fontSize: '11px',
        backgroundColor: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fcd34d',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px'
      }} title="Bot / Crawler">
        🤖 Bot
      </span>
    ) : (
      <span style={{
        padding: '1px 6px',
        borderRadius: '3px',
        fontSize: '11px',
        backgroundColor: '#dcfce7',
        color: '#166534',
        border: '1px solid #bbf7d0',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px'
      }} title="Human visitor">
        👤 Human
      </span>
    )
  );

  // Download QR as PNG (uses the data URL from server)
  const handleDownloadQR = () => {
    if (!data || !data.qrCode) return;

    try {
      const link = document.createElement('a');
      link.href = data.qrCode;
      link.download = `qr-${data.id || short}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      // Fallback: open in new tab
      window.open(data.qrCode, '_blank');
    }
  };

  // Copy short link to clipboard
  const handleCopyShortLink = async () => {
    if (!data) return;
    const shortUrl = `${window.location.origin}/${data.id}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shortUrl);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shortUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1800);
    } catch (e) {
      // Last resort
      prompt('Copy this short link:', shortUrl);
    }
  };

  // Regenerate QR code (calls POST /api/stats/[short])
  const handleRegenerateQR = async () => {
    if (!short || regenerating) return;

    setRegenerating(true);
    setRegenerateSuccess(false);
    setError('');

    try {
      const response = await fetch(`/api/stats/${short}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = '/login';
          return;
        }
        setError(result.error || 'Failed to regenerate QR code');
      } else {
        // Update local data with new QR (and any other refreshed fields)
        setData(result);
        setRegenerateSuccess(true);
        setTimeout(() => setRegenerateSuccess(false), 2200);
      }
    } catch (err) {
      setError('Failed to regenerate QR. Is the server running?');
    } finally {
      setRegenerating(false);
    }
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

  const { id, original, created, accessCount, stats, title, expiresAt, maxClicks, qrCode } = data;

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
        case 'visitor':
          valA = a.is_bot ? 1 : 0;
          valB = b.is_bot ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const shortUrl = typeof window !== 'undefined' ? `${window.location.origin}/${id}` : `/${id}`;

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

      {/* ===================================================== */}
      {/* QR CODE DISPLAY + ACTIONS IN URL DETAIL VIEW          */}
      {/* Always encodes the SHORTENED URL (not original)       */}
      {/* NEW: "Regenerate QR" button added per requirement     */}
      {/* ===================================================== */}
      <div style={{ marginBottom: '32px' }}>
        <h3>QR Code</h3>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          padding: '16px',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-primary)',
          borderRadius: '4px',
          maxWidth: '420px'
        }}>
          {qrCode ? (
            <>
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={qrCode} 
                  alt={`QR code for ${shortUrl}`} 
                  style={{ 
                    maxWidth: '100%', 
                    width: '280px', 
                    height: 'auto',
                    border: '1px solid #ddd',
                    background: '#fff',
                    padding: '8px'
                  }} 
                />
              </div>
              <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
                This QR encodes the shortened URL (scans go through redirect for analytics).
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleDownloadQR}
                  className="secondary"
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                >
                  ⬇ Download QR (PNG)
                </button>
                <button 
                  onClick={handleCopyShortLink}
                  className="secondary"
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                >
                  {copySuccess ? '✓ Copied!' : '📋 Copy Short Link'}
                </button>
                <button 
                  onClick={handleRegenerateQR}
                  className="secondary"
                  disabled={regenerating}
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                >
                  {regenerating ? '⏳ Regenerating...' : '🔄 Regenerate QR Code'}
                </button>
              </div>
              {regenerateSuccess && (
                <div style={{ fontSize: '12px', color: '#166534', textAlign: 'center', marginTop: '4px' }}>
                  ✓ New QR code generated successfully
                </div>
              )}
            </>
          ) : (
            <div className="metadata">
              No QR code available for this link.
              <button 
                onClick={handleRegenerateQR}
                className="secondary"
                disabled={regenerating}
                style={{ marginLeft: '8px', padding: '4px 10px', fontSize: '12px' }}
              >
                {regenerating ? 'Generating...' : 'Generate QR Code'}
              </button>
            </div>
          )}
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
              <th 
                onClick={() => handleSort('visitor')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="Click to sort (alternates asc/desc)"
              >
                Visitor Type{getSortIndicator('visitor')}
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
                <td>
                  <BotBadge isBot={!!stat.is_bot} />
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
