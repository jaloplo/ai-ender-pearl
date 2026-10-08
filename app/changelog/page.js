// Curated dated decisions from ADR.md. Undated ADR entries are intentionally omitted.
const changeHistory = [
  ['2026-10-08', 'Admin visual components gallery', 'Added a protected gallery of the application’s visual components and interaction patterns.'],
  ['2026-10-08', 'Technical design guide', 'Documented architecture, storage contracts, request flows, analytics extension points, security rules, and feature-development workflow.'],
  ['2026-10-08', 'Separate human and bot social-media bars', 'Made each social network display separate horizontal bars for human and bot clicks.'],
  ['2026-10-08', 'Combined social analytics and referer audit', 'Added explanations to analytics visuals, unified social comparison, and exposed visit referers in the audit table.'],
  ['2026-10-04', 'Bot and human social click analytics', 'Separated social click rankings by visitor type and added social origin to recent visits.'],
  ['2026-10-04', 'Access log social-media origin', 'Added a sortable social-origin column to the link access log.'],
  ['2026-10-02', 'Application design rules alignment', 'Aligned controls, forms, results, tables, analytics, QR surfaces, focus states, and responsive behavior with the design guide.'],
  ['2026-10-02', 'Social sharing and attribution', 'Added social sharing actions, source-tagged URLs, and source-aware click analytics.'],
  ['2026-10-02', 'Clicks by browser restricted to browsers', 'Browser analytics now excludes bot traffic, which remains in the dedicated bot ranking.'],
  ['2026-10-01', 'Bot analytics grouped by product', 'Grouped versioned crawler User-Agents by stable product names for clearer rankings.'],
  ['2026-09-22', 'Shared visit classification layer', 'Centralized human and bot classification for redirects, lists, visits, analytics, and access logs.'],
  ['2026-09-22', 'Stats QR actions and Settings label', 'Added QR generation and clipboard actions to statistics and renamed the authenticated management navigation to Settings.'],
  ['2026-09-21', 'Technical database and bot-selection documentation', 'Documented runtime storage selection, file/Cosmos parity, bot detection, deployment, and troubleshooting.'],
  ['2026-09-21', 'Analytics dashboards', 'Added reusable range-based dashboards for all links and individual links with charts, heatmaps, rankings, and human/bot totals.'],
  ['2026-09-21', 'Paginated management and access logs', 'Added consistent ten-item pagination to recent visits and link access logs.'],
  ['2026-08-14', 'Shortening results scoped to each form', 'Placed Standard Link and Decay Link results directly beneath their originating forms.'],
  ['2026-08-14', 'Recent public URL two-column layout', 'Added QR-first recent-link rows with titles, metadata, open actions, and copy actions.'],
  ['2026-07-17', 'URL list search, paging, and cache', 'Added filtering, selectable page sizes, pagination, and browser caching to the protected URL list.'],
  ['', 'QR code regeneration', 'Allowed authenticated users to regenerate a QR code directly from link statistics.'],
  ['', 'Visit audit log and bot identification', 'Added the latest-50 visit audit, persisted bot classification, visitor badges, and QR actions.'],
  ['', 'Decay Link full-width module', 'Added a dedicated Burn After Reading form with privacy messaging, bot protection, one-time access, and retained records.'],
  ['', 'Decay Link re-creation', 'Consumed Decay Links can now be recreated as fresh records for the same original URL.'],
  ['', 'Standard and Decay form differentiation', 'Made Standard primary, greyed the sibling form while submitting, and retained Decay records for statistics.'],
  ['', 'Separate Standard and Decay forms', 'Removed tabs and presented two independent titled forms with matching application styling.'],
  ['', 'Decay tab visual adjustments', 'Removed rounded corners and active borders and added a warning tint to the Decay option.'],
  ['', 'Unified Standard and Decay tabs', 'Made both mode options visually identical inside one shortening form.'],
  ['', 'Decay Link', 'Introduced private single-use links, bot-preview protection, a destroyed page, and a dedicated creation mode.'],
  ['', 'Collapsible advanced options', 'Grouped private links, custom aliases, and expiration inside an accessible collapsible box.'],
  ['', 'Login-gated advanced options', 'Displayed advanced options to everyone while disabling them and omitting their payload for anonymous users.'],
  ['', 'Custom aliases', 'Added validated, unique custom slugs with reserved-path protection.'],
  ['', 'List and stats enhancements', 'Added sorting, column selection, icon actions, richer properties, and sortable access logs.'],
  ['', 'Titles, clicks, and richer recent links', 'Added page-title capture, total clicks, titles in recent links, and copy actions.'],
  ['', 'URL visibility controls', 'Added an auto-saving public/private toggle for every managed URL.'],
  ['', 'QR logo maximization', 'Switched QR codes to the brand logo and increased the safe logo footprint.'],
  ['', 'Recent public links and usage statistics', 'Added public recent links, domain counts, monthly activity, and anonymous social-proof statistics.'],
  ['', 'Homepage split layout', 'Separated descriptive content from the shortening form in a centered responsive two-column layout.'],
  ['', 'Homepage project introduction', 'Identified the page as part of Intranet from the Trenches and linked to the project blog.'],
  ['', 'Resolution-aware logo sizing', 'Adjusted the header logo for high-resolution desktop, normal desktop, and mobile displays.'],
  ['', 'Responsive header review', 'Made the replicated header, logo, actions, and spacer responsive across viewport sizes.'],
  ['', 'Trust signals and feature highlights', 'Added static benefit and security highlights to the homepage.'],
  ['', 'Hero and prominent URL input', 'Added a value-proposition hero and made the primary shortening input and CTA more prominent.'],
  ['', 'README generation', 'Created business-first and technical documentation with architecture and setup guidance.']
].map(([date, title, description]) => ({ date, title, description }));

export const metadata = {
  title: 'Changelog - URL Shortener',
  description: 'Dated application decisions sourced from ADR.md.'
};

function formatDate(date) {
  if(date) {
    return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' })
      .format(new Date(`${date}T12:00:00`));
  }

  return '';
}

export default function ChangelogPage() {
  const orderedHistory = [...changeHistory].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className="history-page" aria-labelledby="history-title">
      <header className="history-intro">
        <p className="eyebrow">Project changelog</p>
        <h1 id="history-title">Changelog</h1>
        <p>Implemented decisions shown from the most recent to the oldest. Numbers follow chronological order, so the oldest item is #1 and the newest has the greatest number.</p>
      </header>
      <section className="history-list" aria-label="Dated implemented decisions">
        {orderedHistory.map((change, index) => (
          <article className="history-entry" key={`${change.date}-${change.title}`}>
            <div className="history-entry-meta">
              <span className="history-number" aria-label={`Changelog item ${orderedHistory.length - index}`}>#{orderedHistory.length - index}</span>
              <time dateTime={change.date} className="history-date">{formatDate(change.date)}</time>
            </div>
            <div className="history-entry-content"><h2>{change.title}</h2><p>{change.description}</p></div>
          </article>
        ))}
      </section>
    </main>
  );
}
