import './globals.css';

export const metadata = {
  title: 'URL Shortener - Intranet from the Trenches',
  description: 'Internal URL Shortener Application',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header>
          <h1>URL Shortener</h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>Intranet from the Trenches</p>
        </header>
        <nav>
          <a href="/">Shorten URL</a>
          <a href="/list">List All URLs</a>
        </nav>
        <div className="container">
          {children}
        </div>
        <footer style={{ textAlign: 'center', marginTop: '30px', fontSize: '11px', color: '#666' }}>
          Internal Use Only • Data stored locally
        </footer>
      </body>
    </html>
  );
}
