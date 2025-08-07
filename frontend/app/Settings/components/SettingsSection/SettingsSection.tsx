// @AI-HINT: This is a reusable wrapper component for each panel within the Settings page. It provides a consistent structure with a title, description, and content area, ensuring a uniform look and feel.

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import commonStyles from './SettingsSection.common.module.css';
import lightStyles from './SettingsSection.light.module.css';
import darkStyles from './SettingsSection.dark.module.css';

interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, children }) => {
  const { theme } = useTheme();

  const styles = React.useMemo(() => {
    const themeStyles = theme === 'light' ? lightStyles : darkStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  return (
    <section className={cn(styles.section)}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </section>
  );
};

export default SettingsSection;
