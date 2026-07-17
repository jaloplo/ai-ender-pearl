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
                    <img alt="Intranet from the Trenches" src="https://substackcdn.com/image/fetch/$s_!DJLh!,e_trim:10:white/e_trim:10:transparent/h_72,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F359c9b86-951a-497f-920b-501d2d45b7fb_1584x396.png" style={{ maxHeight: 36 }}></img>
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
          Internal Use Only • Data stored locally
        </footer>
      </body>
    </html>
  );
}
