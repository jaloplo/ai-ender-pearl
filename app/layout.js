import './globals.css';
import { cookies } from 'next/headers';
import Image from 'next/image';

export const metadata = {
  title: 'Ender Pearl',
  description: 'Intranet from the Trenches URL Shortener Application'
};

export default function RootLayout({ children }) {
  const cookieStore = cookies();
  const authCookie = cookieStore.get('auth');
  const isAuthenticated = authCookie && authCookie.value === 'true';

  return (
    <html lang="en">
      <body>
        {/* Replicated Substack-style header from https://intranetfromthetrenches.substack.com/ */}
        {/* Matches layout (flex 3-col), height 88px, white bg, logo sizes, colours, and structure */}
        <div className="top-bar">
          <div className="top-bar-inner">
            {/* Left: small logo + hamburger (menu icon) */}
            <div className="logo-left">
              
            </div>

            {/* Center: wordmark logo - main logo replication */}
            <div className="logo-center">
              <div style={{ flexGrow: 0 }}>
                <h1 id="wordlogo" style={{ margin: 0 }}>
                  <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    {/* Replicated wordmark: styled text mimicking the image logo (bold, clean, max-height 36px) */}
                    <Image alt="Intranet from the Trenches" src="/logo.png" width={560} height={140}></Image>
                  </a>
                </h1>
              </div>
            </div>

            {/* Right: action buttons - search, share, primary CTA, tertiary */}
            <div className="header-actions">
              <div className="actions">

                {/* Tertiary button - Sign in style */}
                {isAuthenticated ? (
                  <>
                    <a href="/" className="btn-tertiary">Shorten</a>
                    <a href="/list" className="btn-tertiary">List URLs</a>
                  </>
                ) : (
                  <a href="/login" className="btn-tertiary">Login</a>
                )}

                {isAuthenticated && (
                  <a href="/api/auth/logout" className="btn-tertiary" style={{ marginLeft: '4px' }}>Logout</a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Spacer to account for fixed/sticky header height (matches original page) */}
        <div style={{ height: '88px', backgroundColor: '#ffffff' }}></div>

        <div className="container">
          <div className="main-content">
            {children}
          </div>
        </div>

        <footer>
          © 2026 JAIME LÓPEZ — ALL RIGHTS RESERVED
        </footer>
      </body>
    </html>
  );
}
