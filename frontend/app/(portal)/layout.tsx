// @AI-HINT: This is the layout for all authenticated user portals. It uses the AppLayout component to provide a consistent shell with a sidebar and navbar.
// CRITICAL: This layout requires authentication - unauthenticated users are redirected to login.

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppLayout from '../components/AppLayout/AppLayout';
import { getAuthToken, clearAuthData } from '@/lib/api';

export default function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use centralized token retrieval from api.ts
        const token = getAuthToken();
        
        if (!token) {
          const currentPath = pathname || '/client/dashboard';
          setIsAuthenticated(false);
          router.replace(`/login?returnTo=${encodeURIComponent(currentPath)}`);
          return;
        }

        // Validate token with backend
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          // Token invalid or expired - clear all auth data and redirect
          setIsAuthenticated(false);
          clearAuthData();
          const currentPath = pathname || '/client/dashboard';
          router.replace(`/login?returnTo=${encodeURIComponent(currentPath)}`);
          return;
        }

        const user = await res.json();
        const role = (user.user_type || user.role || 'client').toLowerCase();
        setUserRole(role);
        window.localStorage.setItem('user', JSON.stringify(user));
        window.localStorage.setItem('portal_area', role);

        // Check role-based access for specific portal sections
        if (pathname?.startsWith('/admin') && role !== 'admin') {
          router.replace('/client/dashboard');
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        clearAuthData();
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
