// @AI-HINT: This is the DashboardLayout component. It provides the main structural layout for all authenticated pages, combining the Sidebar with the main content area.
'use client';

import React from 'react';
import Sidebar from '../Sidebar/Sidebar';

// AI-HINT: Import all necessary CSS modules for the layout.
import commonStyles from './DashboardLayout.common.module.css';
import lightStyles from './DashboardLayout.light.module.css';
import darkStyles from './DashboardLayout.dark.module.css';

// AI-HINT: In a real app, this would come from a global theme context.
const MOCKED_CURRENT_THEME = 'light';

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const theme = MOCKED_CURRENT_THEME === 'light' ? lightStyles : darkStyles;

  return (
    <div className={commonStyles.dashboardLayout}>
      <Sidebar />
      <main className={`${commonStyles.mainContent} ${theme.mainContent}`}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
