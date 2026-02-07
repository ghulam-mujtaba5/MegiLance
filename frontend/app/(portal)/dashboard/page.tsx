// @AI-HINT: Portal route for main Dashboard - redirects to role-specific dashboard
// This page should only be accessed by authenticated users and will redirect them
// to their role-specific dashboard based on their user type.
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api';

const PortalDashboardPage = () => {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'redirecting'>('checking');

  useEffect(() => {
    const redirect = async () => {
      // Use centralized token retrieval
      const token = getAuthToken();
      
      if (!token) {
        router.replace('/login?returnTo=/dashboard');
        return;
      }

      // Try to get role from localStorage portal_area first
      const portalArea = window.localStorage.getItem('portal_area');
      if (portalArea) {
        setStatus('redirecting');
        if (portalArea === 'admin') {
          router.replace('/admin/dashboard');
        } else if (portalArea === 'freelancer') {
          router.replace('/freelancer/dashboard');
        } else {
          router.replace('/client/dashboard');
        }
        return;
      }
      
      // Fallback: parse user object
      const userStr = window.localStorage.getItem('user');
      if (userStr) {
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
          // Invalid user data - default to client
          router.replace('/client/dashboard');
        }
      } else {
        // No user data but has token - default to client dashboard
        // The portal layout will handle verification
        router.replace('/client/dashboard');
      }
    };
    
    redirect();
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
