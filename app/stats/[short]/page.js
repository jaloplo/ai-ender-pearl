'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import AnalyticsDashboard from '@/app/components/AnalyticsDashboard';

const PAGE_SIZE = 10;

export default function StatsPage() {
  const params = useParams();
  const short = params?.short;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [copySuccess, setCopySuccess] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateSuccess, setRegenerateSuccess] = useState(false);

  const fetchStats = async () => {
    if (!short) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/stats/${short}`);
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) window.location.href = '/login';
        else setError(result.error || 'Failed to load stats');
        return;
      }
      setData(result);
    } catch {
      setError('Failed to fetch stats. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!short) {
      setError('No short code provided');
      setLoading(false);
      return;
    }
    fetchStats();
  }, [short]);

  const handleSort = (column) => {
    if (sortColumn === column) setSortDirection(direction => direction === 'asc' ? 'desc' : 'asc');
    else {
      setSortColumn(column);
      setSortDirection(column === 'timestamp' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  const indicator = (column) => sortColumn === column ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : '';

  const sortedStats = useMemo(() => {
    const stats = [...(data?.stats || [])];
    return stats.sort((a, b) => {
      let first;
      let second;
      switch (sortColumn) {
        case 'timestamp':
          first = new Date(a.timestamp || 0).getTime();
          second = new Date(b.timestamp || 0).getTime();
          break;
        case 'ip': first = a.ip || ''; second = b.ip || ''; break;
        case 'userAgent': first = a.userAgent || ''; second = b.userAgent || ''; break;
        case 'referer': first = a.referer || ''; second = b.referer || ''; break;
        case 'visitor': first = a.is_bot ? 1 : 0; second = b.is_bot ? 1 : 0; break;
        default: return 0;
      }
      const comparison = first < second ? -1 : first > second ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data?.stats, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedStats.length / PAGE_SIZE));
  const visibleStats = sortedStats.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const handleDownloadQR = () => {
    if (!data?.qrCode) return;
    const link = document.createElement('a');
    link.href = data.qrCode;
    link.download = `qr-${data.id || short}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleCopyShortLink = async () => {
    const shortUrl = `${window.location.origin}/${data.id}`;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(shortUrl);
      else {
        const area = document.createElement('textarea');
        area.value = shortUrl; document.body.appendChild(area); area.select();
        document.execCommand('copy'); area.remove();
      }
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1800);
    } catch { prompt('Copy this short link:', shortUrl); }
  };

  const handleRegenerateQR = async () => {
    if (!short || regenerating) return;
    setRegenerating(true); setRegenerateSuccess(false); setError('');
    try {
      const response = await fetch(`/api/stats/${short}`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) window.location.href = '/login';
        else setError(result.error || 'Failed to regenerate QR code');
      } else {
        setData(result); setRegenerateSuccess(true);
        setTimeout(() => setRegenerateSuccess(false), 2200);
      }
    } catch { setError('Failed to regenerate QR. Is the server running?'); }
    finally { setRegenerating(false); }
  };

  if (loading) return <p className="metadata">Loading stats...</p>;
  if (error) return <><h2>Stats Error</h2><div className="error">{error}</div><p><a href="/list">Back to list</a></p></>;
  if (!data) return <p>No data.</p>;

  const { id, original, created, accessCount, title, expiresAt, maxClicks, qrCode, private: isPrivate, decay } = data;
  const displayName = title || original;
  const shortUrl = `${window.location.origin}/${id}`;
  const statsTableRows = [
    ['Original URL', <a href={original} target="_blank" rel="noopener noreferrer">{original}</a>],
    ['Short Code', <code className="short-url">{id}</code>],
    ['Short URL', <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="short-url">{shortUrl}</a>],
    ['Creation Date', new Date(created).toLocaleString()],
    ['Visibility', isPrivate ? 'Private' : 'Public'],
    ['When Expires', expiresAt ? new Date(expiresAt).toLocaleString() : 'Never'],
    ['Max Clicks', maxClicks != null ? maxClicks : 'Unlimited'],
    ['Type', decay ? '🔥 Decay' : 'Standard'],
    ['Total Accesses', accessCount],
  ];

  return <>
    <h2>{displayName}</h2>

    <div className="stats-detail-row">
      <section className="stats-details-panel">
        <h3>Link Details</h3>
        <table className="stats-details-table"><tbody>{statsTableRows.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody></table>
      </section>

      <section className="stats-qr-section">
        <h3>QR Code</h3>
        <div className="qr-stats-panel">
          {qrCode ? <><img src={qrCode} alt={`QR code for ${shortUrl}`} className="qr-stats-image" /><div className="metadata">This QR encodes the shortened URL.</div><div className="qr-stats-actions"><button onClick={handleDownloadQR} className="secondary">⬇ Download QR (PNG)</button><button onClick={handleCopyShortLink} className="secondary">{copySuccess ? '✓ Copied!' : '📋 Copy Short Link'}</button><button onClick={handleRegenerateQR} className="secondary" disabled={regenerating}>{regenerating ? '⏳ Regenerating...' : '🔄 Regenerate QR Code'}</button></div>{regenerateSuccess && <div className="metadata">✓ New QR code generated successfully</div>}</> : <div className="metadata">No QR code available. <button onClick={handleRegenerateQR} className="secondary" disabled={regenerating}>{regenerating ? 'Generating...' : 'Generate QR Code'}</button></div>}
        </div>
      </section>
    </div>

    <AnalyticsDashboard short={short} />

    <section className="access-log-section">
      <h3>Access Log</h3>
      {!sortedStats.length ? <p className="metadata">No accesses recorded yet for this shortened URL.</p> : <>
        <table><thead><tr>{[['timestamp','Date & Time'],['ip','IP Address'],['userAgent','Web Browser (User-Agent)'],['referer','Referer'],['visitor','Visitor Type']].map(([key, label]) => <th key={key} onClick={() => handleSort(key)} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort">{label}{indicator(key)}</th>)}</tr></thead><tbody>
          {visibleStats.map((stat, index) => <tr key={`${stat.timestamp}-${index}`}><td className="metadata">{new Date(stat.timestamp).toLocaleString()}</td><td><code>{stat.ip}</code></td><td style={{ wordBreak: 'break-all', fontSize: '12px' }}>{stat.userAgent}</td><td style={{ wordBreak: 'break-all', fontSize: '12px' }}>{stat.referer ? <a href={stat.referer} target="_blank" rel="noopener noreferrer">{stat.referer}</a> : <span className="metadata">(none)</span>}</td><td><span className={stat.is_bot ? 'visitor-badge bot' : 'visitor-badge human'}>{stat.is_bot ? '🤖 Bot' : '👤 Human'}</span></td></tr>)}
        </tbody></table>
        <div className="access-log-controls"><button className="secondary" onClick={() => setPage(1)} disabled={page === 1}>« First</button><button className="secondary" onClick={() => setPage(page - 1)} disabled={page === 1}>‹ Previous</button><span className="metadata">Page {page} of {totalPages} · Showing {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, sortedStats.length)} of {sortedStats.length}</span><button className="secondary" onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next ›</button><button className="secondary" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last »</button></div>
      </>}
    </section>

    <div style={{ marginTop: '24px' }}><a href="/list" className="btn-tertiary">← Back to URL List</a> {' | '} <a href={`/${id}`} target="_blank" rel="noopener noreferrer">Test redirect</a></div>
  </>;
}
