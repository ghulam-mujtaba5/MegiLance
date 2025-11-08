// @AI-HINT: This is the DashboardLayout, used for client and freelancer pages. It includes the SidebarNav and a main content area.
'use client';

import React from 'react';
import SidebarNav from '@/app/components/SidebarNav/SidebarNav';
import { useTheme } from 'next-themes';
import './DashboardLayout.common.css';
import './DashboardLayout.light.css';
import './DashboardLayout.dark.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: 'client' | 'freelancer';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, userType }) => {
  const { resolvedTheme } = useTheme();

  return (
    <div className={`DashboardLayout DashboardLayout--${resolvedTheme}`}>
      <SidebarNav theme={resolvedTheme} userType={userType} />
      <main className="DashboardLayout-main">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
