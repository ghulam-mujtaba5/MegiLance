// @AI-HINT: This is the main layout component for the freelancer portal. It establishes the primary structure, including a sidebar and a content area, ensuring a consistent and premium user experience across all freelancer pages.
'use client';

// @AI-HINT: This is the main layout component for the freelancer portal. It establishes the primary structure, including a sidebar and a content area, ensuring a consistent and premium user experience across all freelancer pages.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import FreelancerSidebarNav from '../../components/FreelancerSidebarNav/FreelancerSidebarNav';
import commonStyles from './FreelancerLayout.common.module.css';
import lightStyles from './FreelancerLayout.light.module.css';
import darkStyles from './FreelancerLayout.dark.module.css';

interface FreelancerLayoutProps {
  children: React.ReactNode;
}

const FreelancerLayout: React.FC<FreelancerLayoutProps> = ({ children }) => {
  const { theme } = useTheme();

  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  return (
    <div className={styles.layoutContainer}>
      <aside className={styles.sidebar}>
        <FreelancerSidebarNav />
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
};

export default FreelancerLayout;
