'use client';

import { useEffect, useState } from 'react';

const PAGE_SIZE = 10;

export default function RecentVisitsPager() {
  const [visits, setVisits] = useState([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/visits')
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load recent visits');
        return data;
      })
      .then(data => setVisits(data.visits || []))
      .catch(err => setError(err.message));
  }, []);

  const totalPages = Math.max(1, Math.ceil(visits.length / PAGE_SIZE));
  const first = (page - 1) * PAGE_SIZE;
  const visible = visits.slice(first, first + PAGE_SIZE);

  return <section className="recent-visits-pager">
    <h2>Last 50 Visited URLs</h2>
    <p className="metadata">Showing 10 visits per page, up to the 50 latest visit records.</p>
    {error && <div className="error">{error}</div>}
    {!error && !visits.length && <p className="metadata">No visits recorded yet.</p>}
    {!!visible.length && <table><thead><tr><th>Timestamp</th><th>Short Code</th><th>Original URL</th><th>Visitor Type</th></tr></thead><tbody>{visible.map((visit, index) => <tr key={`${visit.short}-${visit.timestamp}-${index}`}><td className="metadata">{new Date(visit.timestamp).toLocaleString()}</td><td><a className="short-url" href={`/stats/${visit.short}`}>{visit.short}</a></td><td style={{ wordBreak: 'break-all' }}>{visit.original}</td><td>{visit.is_bot ? '🤖 Bot' : '👤 Human'}</td></tr>)}</tbody></table>}
    {visits.length > PAGE_SIZE && <div className="recent-visits-controls"><button className="secondary" onClick={() => setPage(1)} disabled={page === 1}>«</button><button className="secondary" onClick={() => setPage(page - 1)} disabled={page === 1}>‹</button><span className="metadata">Page {page} of {totalPages}</span><button className="secondary" onClick={() => setPage(page + 1)} disabled={page === totalPages}>›</button><button className="secondary" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button></div>}
  </section>;
}
