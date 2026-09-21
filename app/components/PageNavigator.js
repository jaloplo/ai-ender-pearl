'use client';

export default function PageNavigator({ page, totalPages, onPageChange, label = 'Page' }) {
  const go = next => onPageChange(Math.max(1, Math.min(next, totalPages)));
  return <nav className="page-navigator" aria-label="Page navigation">
    <button className="secondary" onClick={() => go(1)} disabled={page === 1}>« First</button>
    <button className="secondary" onClick={() => go(page - 1)} disabled={page === 1}>‹ Previous</button>
    <span className="metadata">{label} {page} of {totalPages}</span>
    <button className="secondary" onClick={() => go(page + 1)} disabled={page === totalPages}>Next ›</button>
    <button className="secondary" onClick={() => go(totalPages)} disabled={page === totalPages}>Last »</button>
  </nav>;
}
