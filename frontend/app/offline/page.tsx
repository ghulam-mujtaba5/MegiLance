// @AI-HINT: Offline fallback page for PWA - shown when user has no network connection
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { WifiOff, RefreshCw } from 'lucide-react';

const OfflinePage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => { setOnline(true); window.location.reload(); };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const isDark = resolvedTheme === 'dark';

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: isDark ? '#0f0f1a' : '#f8f9fc',
      color: isDark ? '#e0e0e0' : '#333',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAlign: 'center',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isDark ? 'rgba(69,115,223,0.15)' : 'rgba(69,115,223,0.1)',
        marginBottom: '1.5rem',
      }}>
        <WifiOff size={36} color="#4573df" />
      </div>
      <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
        You&apos;re Offline
      </h1>
      <p style={{ fontSize: '1rem', maxWidth: 420, lineHeight: 1.6, opacity: 0.8, marginBottom: '2rem' }}>
        It looks like you&apos;ve lost your internet connection. Check your network and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
          background: '#4573df', color: '#fff', border: 'none',
          fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(69,115,223,0.3)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        aria-label="Retry connection"
      >
        <RefreshCw size={18} /> Try Again
      </button>
      {online && <p style={{ marginTop: '1rem', color: '#27AE60', fontWeight: 600 }}>Back online! Reloading...</p>}
    </main>
  );
};

export default OfflinePage;
