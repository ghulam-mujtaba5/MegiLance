// @AI-HINT: This is the layout for all authenticated user portals. It uses the AppLayout component to provide a consistent shell with a sidebar and navbar.
// CRITICAL: This layout requires authentication - unauthenticated users are redirected to login.

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppLayout from '../components/AppLayout/AppLayout';

export default function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check multiple storage locations for the access token
        // api.ts uses sessionStorage with 'auth_token', some code uses localStorage with 'access_token'
        const token = window.sessionStorage.getItem('auth_token') || 
                     window.localStorage.getItem('auth_token') ||
                     window.localStorage.getItem('access_token');
        
        if (!token) {
          // No token - redirect to login
          const currentPath = pathname || '/dashboard';
          router.replace(`/login?returnTo=${encodeURIComponent(currentPath)}`);
          return;
        }

        // Validate token with backend
        const res = await fetch('/backend/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          // Token invalid or expired - clear and redirect
          window.localStorage.removeItem('access_token');
          window.localStorage.removeItem('refresh_token');
          window.localStorage.removeItem('user');
          const currentPath = pathname || '/dashboard';
          router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
          return;
        }

        const user = await res.json();
        setUserRole(user.user_type || user.role || 'client');
        window.localStorage.setItem('user', JSON.stringify(user));
        
        // Store portal area based on user role
        const role = (user.user_type || user.role || 'client').toLowerCase();
        if (role === 'admin') {
          window.localStorage.setItem('portal_area', 'admin');
        } else if (role === 'freelancer') {
          window.localStorage.setItem('portal_area', 'freelancer');
        } else {
          window.localStorage.setItem('portal_area', 'client');
        }

        // Check role-based access for specific portal sections
        if (pathname?.startsWith('/admin') && role !== 'admin') {
          router.replace('/dashboard');
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        window.localStorage.removeItem('access_token');
        router.replace('/login');
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
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
        <p style={{ color: '#64748b' }}>Verifying authentication...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Don't render if not authenticated (redirecting)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}
