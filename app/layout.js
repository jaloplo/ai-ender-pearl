import './globals.css';
import { cookies } from 'next/headers';

export const metadata = {
  title: 'URL Shortener - Intranet from the Trenches',
  description: 'Intranet from the Trenches URL Shortener Application'
};

export default function RootLayout({ children }) {
  const cookieStore = cookies();
  const authCookie = cookieStore.get('auth');
  const isAuthenticated = authCookie && authCookie.value === 'true';

  return (
    <html lang="en">
      <body>
        <div className="top-bar">
          <div className="top-bar-inner">
            <div className="logo-left" />
            <div className="logo-center">
              <h1 id="wordlogo" style={{ margin: 0 }}>
                <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <img src="/brand_banner.png" alt="Intranet from the Trenches" className="logo-image" />
                </a>
              </h1>
            </div>
            <div className="header-actions">
              <details className="header-menu">
                <summary className="btn-tertiary">{isAuthenticated ? 'Menu' : 'Sign in'}</summary>
                {isAuthenticated ? (
                  <nav className="header-menu-panel" aria-label="Application menu">
                    <a href="/changelog">Changelog</a>
                    <a href="/list">Settings</a>
                    <a href="/admin/components">Components</a>
                    <a href="/api/auth/logout">Logout</a>
                  </nav>
                ) : (
                  <nav className="header-menu-panel" aria-label="Sign in menu">
                    <a href="/login">Sign in</a>
                  </nav>
                )}
              </details>
            </div>
          </div>
        </div>
        <div className="header-spacer" />
        <div className="container"><div className="main-content">{children}</div></div>
        <footer>© 2026 JAIME LÓPEZ — ALL RIGHTS RESERVED</footer>
      </body>
    </html>
  );
}
