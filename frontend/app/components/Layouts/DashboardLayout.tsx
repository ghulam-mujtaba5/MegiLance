// @AI-HINT: This is the DashboardLayout component. It provides the main structural layout for all authenticated pages, combining the Sidebar with the main content area.
'use client';

import React from 'react';
import Sidebar from '../Sidebar/Sidebar';
import { useTheme } from '@/app/contexts/ThemeContext';
import { cn } from '@/lib/utils';

// AI-HINT: Import all necessary CSS modules for the layout.
import commonStyles from './DashboardLayout.common.module.css';
import lightStyles from './DashboardLayout.light.module.css';
import darkStyles from './DashboardLayout.dark.module.css';

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { theme } = useTheme();

  if (!theme) {
    return null; // Don't render until theme is resolved
  }

  const themeStyles = theme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(commonStyles.dashboardLayout, themeStyles.dashboardLayout)}>
      <Sidebar />
      <main className={cn(commonStyles.mainContent, themeStyles.mainContent)}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
