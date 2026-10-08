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
              <div style={{ flexGrow: 0 }}>
                <h1 id="wordlogo" style={{ margin: 0 }}>
                  <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <img src="/brand_banner.png" alt="Intranet from the Trenches" className="logo-image" />
                  </a>
                </h1>
              </div>
            </div>
            <div className="header-actions">
              <div className="actions">
                <a href="/changelog" className="btn-tertiary">Changelog</a>
                {isAuthenticated ? (
                  <>
                    <a href="/" className="btn-tertiary">Shorten</a>
                    <a href="/list" className="btn-tertiary">Settings</a>
                    <a href="/admin/components" className="btn-tertiary">Components</a>
                  </>
                ) : (
                  <a href="/login" className="btn-tertiary">Login</a>
                )}
                {isAuthenticated && <a href="/api/auth/logout" className="btn-tertiary" style={{ marginLeft: '4px' }}>Logout</a>}
              </div>
            </div>
          </div>
        </div>
        <div className="header-spacer" />
        <div className="container">
          <div className="main-content">{children}</div>
        </div>
        <footer>© 2026 JAIME LÓPEZ — ALL RIGHTS RESERVED</footer>
      </body>
    </html>
  );
}
