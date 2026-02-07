// @AI-HINT: This is the main AppLayout component that creates the shell for authenticated users, combining the Sidebar and Navbar for a cohesive application experience.
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import PortalNavbar from '../Layout/PortalNavbar/PortalNavbar';
import PortalFooter from '../Layout/PortalFooter/PortalFooter';
import { ChatbotAgent } from '@/app/components/AI';

import ErrorBoundary from '@/app/components/ErrorBoundary/ErrorBoundary';

import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { User as UserIcon, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  dashboardNavItems,
  clientNavItems,
  freelancerNavItems,
  adminNavItems,
} from '@/app/config/navigation';

import commonStyles from './AppLayout.common.module.css';
import lightStyles from './AppLayout.light.module.css';
import darkStyles from './AppLayout.dark.module.css';

// @AI-HINT: Build profile menu links based on current area (client/freelancer/admin/general)
// so that portal pages use the portal layout instead of the public website layout.

interface UserData {
  fullName: string;
  full_name?: string;
  email: string;
  bio?: string;
  avatar?: string;
  avatar_url?: string;
  notificationCount?: number;
}

const DEFAULT_USER: UserData = {
  fullName: 'User',
  email: '',
  bio: '',
  avatar: '/mock-avatar.svg',
  notificationCount: 0,
};

function getStoredUser(): UserData {
  if (typeof window === 'undefined') return DEFAULT_USER;
  try {
    const raw = window.localStorage.getItem('user');
    if (!raw) return DEFAULT_USER;
    const parsed = JSON.parse(raw);
    return {
      fullName: parsed.full_name || parsed.fullName || parsed.name || 'User',
      email: parsed.email || '',
      bio: parsed.bio || parsed.title || '',
      avatar: parsed.avatar_url || parsed.avatar || '/mock-avatar.svg',
      notificationCount: parsed.notificationCount || 0,
    };
  } catch {
    return DEFAULT_USER;
  }
}

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<UserData>(DEFAULT_USER);
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();

  // Load real user data from localStorage (set by portal layout auth check)
  useEffect(() => {
    setUser(getStoredUser());
    // Listen for storage changes (e.g. user updates profile in another tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'user') setUser(getStoredUser());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const area: 'client' | 'freelancer' | 'admin' = useMemo(() => {
    if (!pathname) return 'client';
    if (pathname.startsWith('/client')) return 'client';
    if (pathname.startsWith('/freelancer')) return 'freelancer';
    if (pathname.startsWith('/admin')) return 'admin';
    return 'client';
  }, [pathname]);

  // Announce route changes to screen readers
  const [routeAnnouncement, setRouteAnnouncement] = useState('');
  useEffect(() => {
    if (pathname) {
      const pageName = pathname.split('/').pop() || 'Home';
      const formattedName = pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' ');
      setRouteAnnouncement(`Navigated to ${formattedName} page`);
    }
  }, [pathname]);

  const profileMenuItems = useMemo(() => {
    const basePath = `/${area}`;
    return [
      { label: 'Your Profile', href: `${basePath}/profile`, icon: <UserIcon size={16} /> },
      { label: 'Settings', href: `${basePath}/settings`, icon: <Settings size={16} /> },
      { label: 'Sign out', href: '/logout', icon: <LogOut size={16} /> },
    ];
  }, [area]);

  // Remember the current portal area for cross-route redirects from public pages
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('portal_area', area);
    }
  }, [area]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (!resolvedTheme) return null; // Avoid rendering until theme is loaded to prevent flash of unstyled content

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <>
      {/* Skip link for keyboard users */}
      <a 
        href="#main-content" 
        className={cn(commonStyles.skipLink, themeStyles.skipLink)}
      >
        Skip to main content
      </a>
      
      {/* Live region for route announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className={commonStyles.srOnly}
      >
        {routeAnnouncement}
      </div>

      <div className={cn(commonStyles.appLayout, themeStyles.appLayout)}>
        <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} userType={area === 'general' ? undefined : area} />
        <div className={cn(commonStyles.mainContent, isCollapsed && commonStyles.sidebarCollapsed)}>
          <PortalNavbar userType={area} />

          <ErrorBoundary>
            <main 
              id="main-content" 
              className={cn(commonStyles.pageContent, themeStyles.pageContent)}
              role="main"
              aria-label={`${area.charAt(0).toUpperCase() + area.slice(1)} Dashboard content`}
            >
              {children}
              <PortalFooter />
            </main>
          </ErrorBoundary>
          <ChatbotAgent />
        </div>
      </div>
    </>
  );
};

export default AppLayout;
