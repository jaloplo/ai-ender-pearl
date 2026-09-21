'use client';

import { useEffect, useState } from 'react';
import PageNavigator from './PageNavigator';

const PAGE_SIZE = 10;
export default function RecentVisitsPager() {
  const [visits, setVisits] = useState([]); const [page, setPage] = useState(1); const [error, setError] = useState('');
  useEffect(() => { fetch('/api/visits').then(async r => { const d=await r.json(); if(!r.ok) throw new Error(d.error || 'Failed to load recent visits'); return d; }).then(d=>setVisits(d.visits||[])).catch(e=>setError(e.message)); }, []);
  const totalPages=Math.max(1,Math.ceil(visits.length/PAGE_SIZE)); const visible=visits.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  return <section className="recent-visits-pager"><h2>Last 50 Visited URLs</h2><p className="metadata">Showing 10 visits per page, up to the 50 latest visit records.</p>{error&&<div className="error">{error}</div>}{!error&&!visits.length&&<p className="metadata">No visits recorded yet.</p>}{!!visible.length&&<table><thead><tr><th>Timestamp</th><th>Short Code</th><th>Original URL</th><th>Visitor Type</th></tr></thead><tbody>{visible.map((v,i)=><tr key={`${v.short}-${v.timestamp}-${i}`}><td className="metadata">{new Date(v.timestamp).toLocaleString()}</td><td><a className="short-url" href={`/stats/${v.short}`}>{v.short}</a></td><td style={{wordBreak:'break-all'}}>{v.original}</td><td>{v.is_bot===true?'🤖 Bot':'👤 Human'}</td></tr>)}</tbody></table>}{visits.length>PAGE_SIZE&&<PageNavigator page={page} totalPages={totalPages} onPageChange={setPage}/>}</section>;
}
