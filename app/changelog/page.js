const changeHistory = [
  {
    date: '2026-10-08',
    title: 'Admin visual components gallery',
    description: 'Added a protected gallery of the application’s visual components and interaction patterns so future UI changes can be reviewed against the live design language.'
  },
  {
    date: '2026-10-08',
    title: 'Technical design guide',
    description: 'Documented the current architecture, storage contracts, request flows, analytics extension points, security rules, and feature-development workflow.'
  },
  {
    date: '2026-10-08',
    title: 'Separate human and bot social-media bars',
    description: 'Improved the social analytics visual so every network displays separate, readable horizontal bars for human and bot clicks.'
  },
  {
    date: '2026-10-08',
    title: 'Analytics explanations and visit referers',
    description: 'Added explanatory copy beneath analytics visualizations and exposed the referring URL in the recent-visit audit table.'
  },
  {
    date: '2026-10-04',
    title: 'Social analytics by visitor type',
    description: 'Separated social-media click analytics for human and bot traffic and added social origin information to recent visits.'
  },
  {
    date: '2026-10-02',
    title: 'Social sharing and attribution',
    description: 'Added a consolidated sharing popup for LinkedIn, Mastodon, X, Notes, and Substack, with source-tagged URLs and copy actions.'
  },
  {
    date: '2026-10-02',
    title: 'Application design system alignment',
    description: 'Aligned headings, controls, forms, result blocks, tables, analytics, QR surfaces, focus states, and responsive behavior with the application design rules.'
  },
  {
    date: '2026-10-01',
    title: 'Bot analytics grouped by product',
    description: 'Grouped versioned crawler User-Agents by stable product names, making bot rankings easier to understand.'
  },
  {
    date: '2026-09-22',
    title: 'Shared visit classification',
    description: 'Centralized human and bot classification so redirects, URL lists, recent visits, analytics, and access logs use the same rules.'
  },
  {
    date: '2026-09-22',
    title: 'QR actions and Settings navigation',
    description: 'Added QR generation and clipboard actions to link statistics and renamed the authenticated URL-management navigation item to Settings.'
  },
  {
    date: '2026-09-21',
    title: 'Analytics dashboards',
    description: 'Added reusable range-based analytics for all links and individual links, including human/bot totals, browsers, sources, heatmaps, daily activity, and bot rankings.'
  },
  {
    date: '2026-09-21',
    title: 'Paginated management and access logs',
    description: 'Added consistent ten-item pagination to recent visits and link access logs while retaining the latest-50 server-side audit limit.'
  },
  {
    date: '2026-09-21',
    title: 'Stats link detail layout',
    description: 'Reorganized link statistics into a clear details-and-QR area followed by analytics and a sortable access log.'
  },
  {
    date: '2026-08-14',
    title: 'Recent public links redesign',
    description: 'Presented recent public links in a responsive two-column layout with QR codes, titles, source metadata, open actions, and copy actions.'
  },
  {
    date: '2026-08-14',
    title: 'Shortening results per form',
    description: 'Placed Standard Link and Decay Link results directly beneath their respective forms with independent errors and loading states.'
  },
  {
    date: '2024-11-14',
    title: 'QR code regeneration',
    description: 'Allowed authenticated users to regenerate a link QR code directly from its statistics page.'
  },
  {
    date: '2024-11-13',
    title: 'Visit audit log and bot identification',
    description: 'Added the latest-50 visit audit, persisted bot classification, visitor badges, and QR actions in link details.'
  },
  {
    date: '2024-11-12',
    title: 'Decay Link module',
    description: 'Introduced a separate full-width Burn After Reading form with privacy-focused messaging, bot protection, one-time access behavior, and retained internal records.'
  },
  {
    date: '2024-11-03',
    title: 'Custom aliases',
    description: 'Added optional readable custom slugs for shortened URLs with validation, reserved-path protection, and uniqueness checks.'
  },
  {
    date: '2024-11-01',
    title: 'Titles, clicks, and richer recent links',
    description: 'Added best-effort page-title capture, total click statistics, titles in recent public links, and one-click copying.'
  },
  {
    date: '2024-10-31',
    title: 'URL visibility controls',
    description: 'Added an auto-saving public/private visibility toggle for each URL in the authenticated management list.'
  },
  {
    date: '2024-10-29',
    title: 'Public usage statistics',
    description: 'Added anonymous homepage statistics, recent public links, domain counts, monthly activity, and public social-proof teasers.'
  }
];

export const metadata = {
  title: 'Changelog - URL Shortener',
  description: 'A numbered chronological changelog of dated features implemented in the URL Shortener application.'
};

export default function ChangelogPage() {
  const chronologicalHistory = [...changeHistory].reverse();

  return (
    <main className="history-page" aria-labelledby="history-title">
      <header className="history-intro">
        <p className="eyebrow">Project changelog</p>
        <h1 id="history-title">Changelog</h1>
        <p>See what has been implemented in the URL Shortener application, starting with the oldest dated change and ending with the most recent.</p>
      </header>

      <section className="history-list" aria-label="Implemented features in chronological order">
        {chronologicalHistory.map((change, index) => (
          <article className="history-entry" key={`${change.date}-${change.title}`}>
            <div className="history-entry-meta">
              <span className="history-number" aria-label={`Changelog item ${index + 1}`}>#{index + 1}</span>
              <time dateTime={change.date} className="history-date">
                {new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(`${change.date}T12:00:00`))}
              </time>
            </div>
            <div className="history-entry-content">
              <h2>{change.title}</h2>
              <p>{change.description}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
