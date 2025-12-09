// @AI-HINT: Portal route for main Dashboard - redirects to role-specific dashboard
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const PortalDashboardPage = () => {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'redirecting'>('checking');

  useEffect(() => {
    // Get user data from localStorage
    const userStr = window.localStorage.getItem('user');
    const token = window.sessionStorage.getItem('auth_token') || 
                  window.localStorage.getItem('auth_token') ||
                  window.localStorage.getItem('access_token');
    
    if (!token || !userStr) {
      // No auth data - redirect to login
      router.replace('/login?returnTo=/dashboard');
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      const role = (user.user_type || user.role || 'client').toLowerCase();
      setStatus('redirecting');
      
      // Redirect to role-specific dashboard
      if (role === 'admin') {
        router.replace('/admin/dashboard');
      } else if (role === 'freelancer') {
        router.replace('/freelancer/dashboard');
      } else {
        router.replace('/client/dashboard');
      }
    } catch {
      // Invalid user data - redirect to login
      router.replace('/login?returnTo=/dashboard');
    }
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '50vh',
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
      <p style={{ color: '#64748b' }}>
        {status === 'checking' ? 'Checking authentication...' : 'Redirecting to your dashboard...'}
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default PortalDashboardPage;
