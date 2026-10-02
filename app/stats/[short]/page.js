'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import AnalyticsDashboard from '@/app/components/AnalyticsDashboard';
import PageNavigator from '@/app/components/PageNavigator';
import { classifyVisit } from '@/app/lib/visit-classification';

const PAGE_SIZE = 10;
const SOCIAL_NETWORKS = [
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'mastodon', label: 'Mastodon' },
  { key: 'x', label: 'X' },
  { key: 'notes', label: 'Notes' },
  { key: 'substack', label: 'Substack' },
];

function TwitterIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21.5 5.2c-.7.3-1.4.5-2.2.6.8-.5 1.4-1.2 1.7-2.1-.8.5-1.6.8-2.5 1A3.9 3.9 0 0 0 11.8 7c0 .3 0 .6.1.9-3.2-.2-6-1.7-7.9-4-.3.6-.5 1.2-.5 2 0 1.3.7 2.5 1.7 3.2-.6 0-1.2-.2-1.7-.5 0 1.9 1.3 3.5 3.1 3.8-.3.1-.7.1-1 .1-.2 0-.5 0-.7-.1.5 1.6 2 2.7 3.7 2.7A7.8 7.8 0 0 1 3.8 17c-.3 0-.7 0-1-.1A11 11 0 0 0 8.7 19c6.6 0 10.2-5.5 10.2-10.2v-.5c.7-.5 1.3-1 1.8-1.6Z" /></svg>;
}

export default function StatsPage() {
  const { short } = useParams();
  const [data, setData] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const [refreshingQr, setRefreshingQr] = useState(false), [copyingQr, setCopyingQr] = useState(false), [qrMessage, setQrMessage] = useState('');
  const [refreshingTitle, setRefreshingTitle] = useState(false), [titleMessage, setTitleMessage] = useState('');
  const [copiedSocial, setCopiedSocial] = useState('');
  const [page, setPage] = useState(1), [sort, setSort] = useState({ column: 'timestamp', direction: 'desc' });

  const load = async () => { if (!short) return; setLoading(true); try { const response = await fetch(`/api/stats/${short}`), result = await response.json(); if (!response.ok) throw new Error(result.error || 'Failed to load stats'); setData(result); setError(''); } catch (err) { setError(err.message || 'Failed to fetch stats.'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [short]);
  const regenerateQr = async () => { setRefreshingQr(true); setQrMessage(''); try { const response = await fetch(`/api/stats/${short}`, { method: 'POST' }), result = await response.json(); if (!response.ok) throw new Error(result.error || 'Could not generate QR code'); setData(result); setQrMessage('QR code generated successfully.'); } catch (err) { setQrMessage(err.message || 'Could not generate QR code.'); } finally { setRefreshingQr(false); } };
  const copyQr = async () => { if (!data?.qrCode) return; setCopyingQr(true); setQrMessage(''); try { if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error('Image clipboard is not supported by this browser.'); const response = await fetch(data.qrCode); if (!response.ok) throw new Error('Could not read the QR code image.'); const blob = await response.blob(); await navigator.clipboard.write([new ClipboardItem({ [blob.type || 'image/png']: blob })]); setQrMessage('QR code copied to the clipboard.'); } catch (err) { setQrMessage(err.message || 'Could not copy the QR code.'); } finally { setCopyingQr(false); } };
  const refreshTitle = async () => { setRefreshingTitle(true); setTitleMessage(''); try { const response = await fetch(`/api/stats/${short}/title`, { method: 'POST' }), result = await response.json(); if (!response.ok) throw new Error(result.error || 'Could not refresh title'); setData(previous => ({ ...previous, title: result.title })); setTitleMessage('Title updated successfully.'); } catch (err) { setTitleMessage(err.message); } finally { setRefreshingTitle(false); } };

  const stats = data?.stats || [];
  const sorted = useMemo(() => [...stats].sort((a, b) => { const value = item => sort.column === 'timestamp' ? new Date(item.timestamp || 0).getTime() : sort.column === 'visitor' ? (classifyVisit(item) ? 1 : 0) : String(item[sort.column] || '').toLowerCase(); const comparison = value(a) < value(b) ? -1 : value(a) > value(b) ? 1 : 0; return sort.direction === 'asc' ? comparison : -comparison; }), [stats, sort]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const changeSort = column => setSort(previous => previous.column === column ? { column, direction: previous.direction === 'asc' ? 'desc' : 'asc' } : { column, direction: column === 'timestamp' ? 'desc' : 'asc' });
  const arrow = column => sort.column === column ? (sort.direction === 'asc' ? ' ▲' : ' ▼') : '';
  const socialUrl = (item, source) => { const url = new URL(item, window.location.origin); url.searchParams.set('source', source); return url.toString(); };
  const copySocial = async (url, source) => { try { await navigator.clipboard.writeText(url); setCopiedSocial(source); setTimeout(() => setCopiedSocial(''), 1800); } catch { setError('Unable to copy this social media URL.'); } };

  if (loading) return <p className="metadata">Loading stats...</p>;
  if (error) return <><h2>Stats Error</h2><div className="error">{error}</div></>;
  if (!data) return <p>No data.</p>;
  const { id, original, created, title, expiresAt, maxClicks, qrCode, private: isPrivate, decay } = data;
  const shortUrl = `${window.location.origin}/${id}`;
  const humans = stats.filter(stat => !classifyVisit(stat)).length, bots = stats.filter(stat => classifyVisit(stat)).length;
  const rows = [
    ['Original URL', <a href={original} target="_blank" rel="noopener noreferrer" key="original">{original}</a>],
    ['Short Code', <code className="short-url" key="code">{id}</code>],
    ['Short URL', <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="short-url" key="short">{shortUrl}</a>],
    ...SOCIAL_NETWORKS.map(network => { const url = socialUrl(shortUrl, network.key); return [network.label, <span className="social-detail-row" key={network.key}><a href={url} target="_blank" rel="noopener noreferrer">{url}</a></span>]; }),
    ['Creation Date', new Date(created).toLocaleString()], ['Visibility', isPrivate ? 'Private' : 'Public'], ['When Expires', expiresAt ? new Date(expiresAt).toLocaleString() : 'Never'], ['Max Clicks', maxClicks ?? 'Unlimited'], ['Type', decay ? '🔥 Decay' : 'Standard'], ['Total Accesses', `${humans} (${bots})`],
  ];

  return <>
    <h2>{title || original}</h2>
    <section className="stats-detail-row"><div className="stats-details-panel"><h2>Link Details</h2><table className="stats-details-table"><tbody>{rows.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody></table></div>
      <section className="stats-qr-section"><h2>QR Code</h2><div className="qr-stats-panel">{qrCode ? <img src={qrCode} alt={`QR code for ${shortUrl}`} className="qr-stats-image" /> : <p className="metadata">No QR code available.</p>}<p className="metadata">This QR encodes the shortened URL.</p><div className="qr-stats-actions"><button className="secondary" onClick={regenerateQr} disabled={refreshingQr}>{refreshingQr ? 'Generating QR code...' : '↻ Generate QR code'}</button><button className="secondary" onClick={copyQr} disabled={!qrCode || copyingQr}>{copyingQr ? 'Copying QR code...' : '▣ Copy QR code'}</button></div>{qrMessage && <p className="metadata" role="status">{qrMessage}</p>}<button className="secondary" onClick={refreshTitle} disabled={refreshingTitle}>{refreshingTitle ? 'Reading original URL...' : '↻ Read original URL title again'}</button>{titleMessage && <p className="metadata">{titleMessage}</p>}</div></section>
    </section>
    <AnalyticsDashboard short={short} />
    <section className="access-log-section"><h2>Access Log</h2>{!sorted.length ? <p className="metadata">No accesses recorded yet for this shortened URL.</p> : <><table><thead><tr>{[['timestamp','Date & Time'],['ip','IP Address'],['userAgent','Web Browser (User-Agent)'],['referer','Referer'],['visitor','Visitor Type']].map(([key, label]) => <th key={key} onClick={() => changeSort(key)}>{label}{arrow(key)}</th>)}</tr></thead><tbody>{sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((stat, index) => <tr key={`${stat.timestamp}-${index}`}><td>{new Date(stat.timestamp).toLocaleString()}</td><td><code>{stat.ip}</code></td><td style={{ wordBreak: 'break-all' }}>{stat.userAgent}</td><td style={{ wordBreak: 'break-all' }}>{stat.referer || '(none)'}</td><td>{classifyVisit(stat) ? '🤖 Bot' : '👤 Human'}</td></tr>)}</tbody></table><PageNavigator page={page} totalPages={totalPages} onPageChange={setPage} /></>}</section><p><a href="/list">← Back to URL List</a></p>
  </>;
}
