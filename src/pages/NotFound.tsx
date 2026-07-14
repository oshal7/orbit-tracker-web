import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0A0A0A',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif",
        textAlign: 'center',
      }}
    >
      <div>
        <h1 style={{ fontSize: 40, fontWeight: 600, margin: 0 }}>404</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '8px 0 18px' }}>Oops! Page not found</p>
        <a href="/" style={{ color: '#5B9EFF', fontSize: 13, textDecoration: 'underline' }}>
          Return to Home
        </a>
      </div>
    </div>
  );
}
