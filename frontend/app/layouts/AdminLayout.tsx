// @AI-HINT: This is the AdminLayout, used for all admin-facing pages. It includes the SidebarNav with admin links.
'use client';

import React from 'react';
import SidebarNav from '@/app/components/SidebarNav/SidebarNav';
import { useTheme } from 'next-themes';
import './DashboardLayout.common.css'; // Reusing dashboard layout styles
import './DashboardLayout.light.css';
import './DashboardLayout.dark.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { resolvedTheme } = useTheme();

  return (
    <div className={`DashboardLayout DashboardLayout--${resolvedTheme}`}>
      <SidebarNav theme={resolvedTheme} userType="admin" />
      <main className="DashboardLayout-main">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
