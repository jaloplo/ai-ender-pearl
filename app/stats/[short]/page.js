'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function StatsPage() {
  const params = useParams();
  const short = params?.short;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const { id, original, created, accessCount, stats } = data;

  return (
    <>
      <h2>Access Statistics for {id}</h2>

      <div style={{ marginBottom: '16px' }}>
        <strong>Access Count:</strong> {accessCount} {accessCount === 1 ? 'time' : 'times'}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <strong>Short Code:</strong> <code className="short-url">{id}</code><br />
        <strong>Original URL:</strong>{' '}
        <a href={original} target="_blank" rel="noopener noreferrer">{original}</a><br />
        <strong>Created:</strong> {new Date(created).toLocaleString()}
      </div>

      <h3>Access Log</h3>

      {accessCount === 0 && (
        <p className="metadata">No accesses recorded yet for this shortened URL.</p>
      )}

      {accessCount > 0 && (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Date &amp; Time</th>
              <th>IP Address</th>
              <th>Web Browser (User-Agent)</th>
              <th>Referer</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat, index) => (
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
