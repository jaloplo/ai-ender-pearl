'use client';

import { useEffect, useMemo, useState } from 'react';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const RANGE_LABELS = { week: '1 week', month: '1 month', quarter: '3 months', all: 'All time' };

function Empty({ children }) { return <p className="analytics-empty">{children || 'No visits in this period.'}</p>; }

function BarChart({ data, stacked = false }) {
  const max = Math.max(1, ...data.map(d => stacked ? d.human + d.bot : Math.max(d.human, d.bot)));
  const width = Math.max(520, data.length * 30); const height = 220; const bottom = 42; const chartH = 155;
  return <div className="chart-scroll"><svg className="analytics-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Clicks per day">
    {data.map((d, i) => { const x = 10 + i * ((width - 20) / data.length); const group = (width - 20) / data.length * .72; const bw = Math.max(4, group / 2 - 2); const humanH = d.human / max * chartH; const botH = d.bot / max * chartH; const label = d.date.slice(5); return <g key={d.date}>
      {stacked ? <><rect x={x + group / 2 - bw / 2} y={height - bottom - botH} width={bw} height={botH} fill="#d97706"><title>{d.date}: bots {d.bot}</title></rect><rect x={x + group / 2 - bw / 2} y={height - bottom - botH - humanH} width={bw} height={humanH} fill="#66cd7a"><title>{d.date}: humans {d.human}</title></rect></> : <><rect x={x + group / 2 - bw - 1} y={height - bottom - humanH} width={bw} height={humanH} fill="#66cd7a"><title>{d.date}: humans {d.human}</title></rect><rect x={x + group / 2 + 1} y={height - bottom - botH} width={bw} height={botH} fill="#d97706"><title>{d.date}: bots {d.bot}</title></rect></>}
      <text x={x + group / 2} y={height - 18} textAnchor="middle" className="chart-label">{label}</text>
    </g>; })}
    <line x1="5" y1={height - bottom} x2={width - 5} y2={height - bottom} stroke="#bbb" />
  </svg></div>;
}

function Legend() { return <div className="chart-legend"><span><i className="legend-human" /> Humans</span><span><i className="legend-bot" /> Bots</span></div>; }
function Pie({ human, bot }) { const total = human + bot; if (!total) return <Empty />; const humanPct = human / total * 100; return <div className="pie-layout"><div className="pie" style={{ background: `conic-gradient(#66cd7a 0 ${humanPct}%, #d97706 ${humanPct}% 100%)` }} aria-label={`Humans ${humanPct.toFixed(1)} percent, bots ${(100-humanPct).toFixed(1)} percent`} /><div><strong>{total} clicks</strong><p className="metadata">👤 Humans: {human} ({humanPct.toFixed(1)}%)<br />🤖 Bots: {bot} ({(100-humanPct).toFixed(1)}%)</p></div></div>; }
function Ranking({ rows }) { if (!rows.length) return <Empty />; const max = rows[0].value || 1; return <div className="ranking">{rows.map(row => <div className="ranking-row" key={row.label}><span>{row.label}</span><div className="ranking-track"><b style={{ width: `${row.value / max * 100}%` }} /></div><strong>{row.value}</strong></div>)}</div>; }
function Heatmap({ values }) { const max = Math.max(1, ...values.flat()); return <div className="heatmap-wrap"><div className="heatmap-hours">{Array.from({ length: 24 }, (_, h) => <span key={h}>{h}</span>)}</div><div>{values.map((row, day) => <div className="heatmap-row" key={day}><span className="heatmap-day">{DAY_LABELS[day]}</span>{row.map((value, hour) => <span key={hour} className="heat-cell" style={{ backgroundColor: `rgba(102, 205, 122, ${value ? .12 + value / max * .88 : .04})` }} title={`${DAY_LABELS[day]} ${hour}:00 — ${value} visits`} />)}</div>)}</div></div>; }

export default function AnalyticsDashboard({ short = null }) {
  const [range, setRange] = useState('week'); const [data, setData] = useState(null); const [error, setError] = useState('');
  useEffect(() => { let cancelled = false; setData(null); setError(''); const query = new URLSearchParams({ range }); if (short) query.set('short', short); fetch(`/api/analytics?${query}`).then(async r => { const json = await r.json(); if (!r.ok) throw new Error(json.error || 'Analytics could not be loaded'); return json; }).then(json => { if (!cancelled) setData(json); }).catch(e => { if (!cancelled) setError(e.message); }); return () => { cancelled = true; }; }, [range, short]);
  const shownDays = useMemo(() => data?.byDay || [], [data]);
  return <section className="analytics-dashboard" aria-label={short ? 'Link analytics' : 'Analytics for all links'}>
    <div className="analytics-header"><div><h2>{short ? 'Link Analytics' : 'Analytics for All Links'}</h2><p className="metadata">Human and bot clicks grouped by period.</p></div><div className="analytics-ranges">{Object.entries(RANGE_LABELS).map(([key, label]) => <button key={key} className={range === key ? 'analytics-range active' : 'analytics-range'} onClick={() => setRange(key)}>{label}</button>)}</div></div>
    {error && <div className="error">{error}</div>}
    {!data && !error && <p className="metadata">Loading analytics...</p>}
    {data && <><div className="analytics-grid"><article className="analytics-card"><h3>Humans vs Bots</h3><Pie human={data.human} bot={data.bot} /></article><article className="analytics-card analytics-wide"><h3>Clicks per Day</h3><Legend />{shownDays.length ? <BarChart data={shownDays} /> : <Empty />}</article><article className="analytics-card analytics-wide"><h3>Daily Accumulation</h3><Legend />{shownDays.length ? <BarChart data={shownDays} stacked /> : <Empty />}</article>{!short && <><article className="analytics-card analytics-wide"><h3>Day and Hour Heatmap</h3><Heatmap values={data.heatmap} /></article><article className="analytics-card"><h3>Clicks by Browser</h3><Ranking rows={data.browsers} /></article><article className="analytics-card"><h3>Clicks by Source</h3><Ranking rows={data.sources} /></article></>}</div><p className="metadata analytics-footer">Updated: {new Date(data.generatedAt).toLocaleString()}</p></>}
  </section>;
}
