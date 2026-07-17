import './globals.css';
import { cookies } from 'next/headers';

export const metadata = {
  title: 'URL Shortener - Intranet from the Trenches',
  description: 'Internal URL Shortener Application',
};

export default function RootLayout({ children }) {
  const cookieStore = cookies();
  const authCookie = cookieStore.get('auth');
  const isAuthenticated = authCookie && authCookie.value === 'true';

  return (
    <html lang="en">
      <body>
        <header>
          <div className="header-inner">
            <div>
              <h1>URL Shortener</h1>
              <p className="subtitle">Intranet from the Trenches</p>
            </div>
          </div>
        </header>
        
        <nav>
          <div className="nav-inner">
            <a href="/">Shorten URL</a>
            {isAuthenticated ? (
              <>
                <a href="/list">List All URLs</a>
                <a href="/api/auth/logout" className="nav-right">Logout</a>
              </>
            ) : (
              <a href="/login">Login</a>
            )}
          </div>
        </nav>

        <div className="container">
          <div className="main-content">
            {children}
          </div>
        </div>

        <footer>
          Internal Use Only • Data stored locally
        </footer>
      </body>
    </html>
  );
}
