// @AI-HINT: This is the main layout for the freelancer settings section. It establishes a premium, responsive two-panel layout with the SettingsNav on the side and the page content in the main area.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import SettingsNav from './components/SettingsNav/SettingsNav';

import commonStyles from './Layout.common.module.css';
import lightStyles from './Layout.light.module.css';
import darkStyles from './Layout.dark.module.css';

interface FreelancerSettingsLayoutProps {
  children: React.ReactNode;
}

export default function FreelancerSettingsLayout({ children }: FreelancerSettingsLayoutProps) {
  const { theme } = useTheme();
  const styles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.container, styles.container)}>
      <header className={cn(commonStyles.header, styles.header)}>
        <h1 className={cn(commonStyles.title, styles.title)}>Settings</h1>
        <p className={cn(commonStyles.subtitle, styles.subtitle)}>
          Manage your account, password, and notification preferences.
        </p>
      </header>
      <div className={cn(commonStyles.mainContainer, styles.mainContainer)}>
        <aside className={cn(commonStyles.sidebar, styles.sidebar)}>
          <SettingsNav />
        </aside>
        <main className={cn(commonStyles.content, styles.content)}>
          {children}
        </main>
      </div>
    </div>
  );
}
