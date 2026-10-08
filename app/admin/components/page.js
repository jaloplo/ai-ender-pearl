'use client';

import { useState } from 'react';
import PageNavigator from '@/app/components/PageNavigator';

const fakeRows = [
  { code: 'pearl42', title: 'Internal launch notes', visibility: 'Public', accesses: '12 (2)' },
  { code: 'ops-2026', title: 'Operations handbook', visibility: 'Private', accesses: '8 (0)' },
  { code: 'readme', title: 'Team documentation', visibility: 'Public', accesses: '31 (4)' },
];

function SampleSection({ title, description, children, className = '' }) {
  return (
    <section className={`component-showcase ${className}`} aria-labelledby={`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-title`}>
      <div className="component-showcase-heading">
        <div>
          <h2 id={`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-title`}>{title}</h2>
          {description && <p className="metadata">{description}</p>}
        </div>
        <code className="component-name">{title}</code>
      </div>
      <div className="component-showcase-body">{children}</div>
    </section>
  );
}

function FakeAnalytics() {
  const bars = [38, 72, 48, 94, 62, 30, 80];
  return (
    <div className="component-fake-analytics">
      <div className="fake-chart" aria-label="Example clicks per day chart">
        {bars.map((height, index) => <span key={index} style={{ height: `${height}%` }} title={`${height} clicks`} />)}
      </div>
      <div className="chart-legend"><span><i className="legend-human" /> Humans</span><span><i className="legend-bot" /> Bots</span></div>
    </div>
  );
}

export default function ComponentsGalleryPage() {
  const [active, setActive] = useState(false);
  const [page, setPage] = useState(2);

  return (
    <div className="components-gallery">
      <div className="page-title-block">
        <p className="eyebrow">Admin design reference</p>
        <h1>Visual Components Gallery</h1>
        <p>One protected catalog of the application’s current visual language. Use these examples when building or reviewing future pages.</p>
      </div>

      <SampleSection title="Headers" description="Editorial heading hierarchy from H1 through H6.">
        <h1>Header 1 — Page heading</h1><h2>Header 2 — Major section</h2><h3>Header 3 — Subsection</h3>
        <h4>Header 4 — Supporting heading</h4><h5>Header 5 — Compact heading</h5><h6>Header 6 — Small heading</h6>
      </SampleSection>

      <SampleSection title="Text and titles" description="Page titles, section labels, paragraphs, links, metadata, and technical values.">
        <div className="jumbotron"><p className="eyebrow">Jumbotron / intro</p><h2>Short links for internal work</h2><p>Use a concise introduction to explain the benefit and orient the reader before the primary task.</p></div>
        <strong className="form-section-title">Title / form section title</strong>
        <p>This is a paragraph with an <a href="/admin/components">example contextual link</a> and supporting copy that remains readable on every surface.</p>
        <p className="metadata">Metadata, timestamps, helper text, and secondary information appear in this quieter style.</p>
        <code className="short-url">https://example.com/a-long-generated-short-url</code>
      </SampleSection>

      <SampleSection title="Sections and articles" description="Semantic content containers with a restrained editorial treatment.">
        <article className="component-article"><h3>Article title</h3><p>Articles hold a focused piece of content, such as an explanation, update, or operational note.</p><p className="metadata">Published October 8, 2026 · Internal reference</p></article>
      </SampleSection>

      <SampleSection title="Buttons and actions" description="Primary, secondary, active, danger, disabled, and compact icon actions.">
        <div className="component-action-row"><button onClick={() => setActive(!active)}>{active ? 'Active button' : 'Primary button'}</button><button className="secondary">Secondary button</button><button className="decay-cta">Danger button</button><button className="secondary" disabled>Disabled button</button><button className="action-btn" aria-label="Example statistics action" title="Statistics">📊</button></div>
        <p className="metadata">Interactive sample state: <strong>{active ? 'active' : 'inactive'}</strong></p>
      </SampleSection>

      <SampleSection title="Forms and feedback" description="Labels, controls, helper text, validation, success, and warning states.">
        <div className="component-form-grid"><div><label htmlFor="gallery-url">Original URL</label><input id="gallery-url" defaultValue="https://intranet.example.com/article" /><span className="metadata">Visible labels and helper text stay above or below the control.</span></div><div><label htmlFor="gallery-select">Visibility</label><select id="gallery-select" defaultValue="public"><option value="public">Public</option><option value="private">Private</option></select></div></div>
        <div className="error">Error state: explain what happened and how the user can recover.</div><div className="component-success" role="status">Success state: the link was copied successfully.</div><div className="component-warning">Warning state: this action creates a single-use link.</div>
      </SampleSection>

      <SampleSection title="Cards and results" description="Stats cards, link results, badges, and QR presentation.">
        <div className="stats-cards"><div className="stat-card"><div className="stat-value">42</div><div className="stat-label">Total Links</div></div><div className="stat-card"><div className="stat-value">128</div><div className="stat-label">Total Clicks</div></div><div className="stat-card"><div className="stat-value">7</div><div className="stat-label">Domains</div></div></div>
        <div className="result"><strong>Shortened URL</strong><br /><a className="short-url" href="https://example.com/pearl42">https://example.com/pearl42</a><p><strong>Original:</strong> https://intranet.example.com/handbook</p><span className="badge-human">Public</span> <span className="badge-bot">🤖 Bot sample</span></div>
        <div className="component-qr"><div className="qr-placeholder">QR</div><div><h3>QR Code</h3><p className="metadata">This QR encodes the shortened URL.</p><button className="secondary">Download QR</button></div></div>
      </SampleSection>

      <SampleSection title="Tables and rows" description="Comparable data uses semantic table headers, borders, wrapping, and row striping.">
        <table><thead><tr><th scope="col">Short Code</th><th scope="col">Title</th><th scope="col">Visibility</th><th scope="col">Accesses</th><th scope="col">Actions</th></tr></thead><tbody>{fakeRows.map(row => <tr key={row.code}><td><code className="short-url">{row.code}</code></td><td>{row.title}</td><td>{row.visibility}</td><td>{row.accesses}</td><td><button className="action-btn" aria-label={`View ${row.code} statistics`}>📊</button> <button className="action-btn" aria-label={`Copy ${row.code}`}>⧉</button></td></tr>)}</tbody></table>
      </SampleSection>

      <SampleSection title="Pager and navigation" description="The shared page navigator used by lists and access logs.">
        <PageNavigator page={page} totalPages={5} onPageChange={setPage} label="Example page" />
        <p className="metadata">Showing {(page - 1) * 10 + 1}–{page * 10} of 50 fake records.</p>
      </SampleSection>

      <SampleSection title="Analytics and visits" description="Fake data illustrates the visual structure without querying live analytics or exposing records.">
        <div className="analytics-card"><h3>Clicks per Day</h3><p className="metadata">Daily click volume separated by visitor type.</p><FakeAnalytics /></div>
        <div className="recent-visits-pager"><h3>Recent visit row</h3><table><tbody><tr><td>10/08/2026, 10:42</td><td><code>pearl42</code></td><td>https://intranet.example.com/article</td><td>—</td><td>👤 Human</td></tr><tr><td>10/08/2026, 10:30</td><td><code>readme</code></td><td>https://intranet.example.com/docs</td><td>LinkedIn</td><td>🤖 Bot</td></tr></tbody></table></div>
      </SampleSection>
    </div>
  );
}
