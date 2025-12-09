// @AI-HINT: Portal landing page - redirects users to their appropriate dashboard based on role
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PortalPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Redirect to appropriate dashboard based on user role
    const redirectToDashboard = async () => {
      try {
        const area = window.localStorage.getItem('portal_area');
        const token = window.localStorage.getItem('access_token');
        
        if (!token) {
          // No token - redirect to login
          router.replace('/login?redirect=/portal');
          return;
        }

        // Fetch user to get their role
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          // Token invalid - redirect to login
          window.localStorage.removeItem('access_token');
          window.localStorage.removeItem('refresh_token');
          window.localStorage.removeItem('user');
          router.replace('/login?redirect=/portal');
          return;
        }

        const user = await res.json();
        const role = (user.user_type || user.role || 'client').toLowerCase();

        // Redirect based on role
        if (role === 'admin') {
          router.replace('/admin/dashboard');
        } else if (role === 'freelancer') {
          router.replace('/freelancer/dashboard');
        } else {
          router.replace('/client/dashboard');
        }
      } catch (error) {
        console.error('Portal redirect error:', error);
        router.replace('/login');
      }
      setChecking(false);
    };
    
    redirectToDashboard();
  }, [router]);

  // Show loading while redirecting
  if (checking) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'var(--bg-primary, #f8fafc)',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#4573df',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#64748b' }}>Redirecting to your dashboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return null;
}
