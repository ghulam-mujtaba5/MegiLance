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

const user = {
  fullName: 'John Doe',
  email: 'john.doe@megilance.com',
  bio: 'Investor & Entrepreneur',
  avatar: '/mock-avatar.svg',
  notificationCount: 3,
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();

  const area: 'client' | 'freelancer' | 'admin' | 'general' = useMemo(() => {
    if (!pathname) return 'general';
    if (pathname.startsWith('/client')) return 'client';
    if (pathname.startsWith('/freelancer')) return 'freelancer';
    if (pathname.startsWith('/admin')) return 'admin';
    return 'general';
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
    switch (area) {
      case 'client':
        return [
          { label: 'Your Profile', href: '/client/profile', icon: <UserIcon size={16} /> },
          { label: 'Settings', href: '/client/settings', icon: <Settings size={16} /> },
          { label: 'Sign out', href: '/logout', icon: <LogOut size={16} /> },
        ];
      case 'freelancer':
        return [
          { label: 'Your Profile', href: '/freelancer/profile', icon: <UserIcon size={16} /> },
          { label: 'Settings', href: '/freelancer/settings', icon: <Settings size={16} /> },
          { label: 'Sign out', href: '/logout', icon: <LogOut size={16} /> },
        ];
      case 'admin':
        return [
          { label: 'Your Profile', href: '/admin/profile', icon: <UserIcon size={16} /> },
          { label: 'Settings', href: '/admin/settings', icon: <Settings size={16} /> },
          { label: 'Sign out', href: '/logout', icon: <LogOut size={16} /> },
        ];
      default:
        return [
          { label: 'Your Profile', href: '/Profile', icon: <UserIcon size={16} /> },
          { label: 'Settings', href: '/Settings', icon: <Settings size={16} /> },
          { label: 'Sign out', href: '/logout', icon: <LogOut size={16} /> },
        ];
    }
  }, [area]);

  // Remember the current portal area for cross-route redirects from public pages
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (area === 'client' || area === 'freelancer' || area === 'admin') {
        window.localStorage.setItem('portal_area', area);
      } else {
        // do not overwrite when in general area
      }
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
          <PortalNavbar />

          <ErrorBoundary>
            <main 
              id="main-content" 
              className={cn(commonStyles.pageContent, themeStyles.pageContent)}
              role="main"
              aria-label={`${area === 'general' ? '' : area.charAt(0).toUpperCase() + area.slice(1) + ' '}Dashboard content`}
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
