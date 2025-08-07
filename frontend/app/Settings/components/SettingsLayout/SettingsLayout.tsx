// @AI-HINT: This component provides the main two-column layout for the entire Settings page, with a sidebar for navigation and a content area for the active settings section. This structure is key to a premium user experience.

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import commonStyles from './SettingsLayout.common.module.css';
import lightStyles from './SettingsLayout.light.module.css';
import darkStyles from './SettingsLayout.dark.module.css';

interface SettingsLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ sidebar, children }) => {
  const { theme } = useTheme();

  const styles = React.useMemo(() => {
    const themeStyles = theme === 'light' ? lightStyles : darkStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  return (
    <div className={styles.settingsLayout}>
      <aside className={styles.sidebar}>
        {sidebar}
      </aside>
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
};

export default SettingsLayout;
