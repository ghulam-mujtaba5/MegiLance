// @AI-HINT: This is a reusable component for displaying a feed of recent activities, such as job postings or transactions. It's designed to be generic and handles its own loading and empty states.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import commonStyles from './RecentActivityFeed.base.module.css';
import lightStyles from './RecentActivityFeed.light.module.css';
import darkStyles from './RecentActivityFeed.dark.module.css';

interface RecentActivityFeedProps<T> {
  title: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  loading: boolean;
  emptyStateMessage: string;
  className?: string;
}

const RecentActivityFeed = <T extends { id: string | number }>({ 
  title, 
  items, 
  renderItem, 
  loading, 
  emptyStateMessage, 
  className 
}: RecentActivityFeedProps<T>) => {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <section className={cn(commonStyles.section, themeStyles.section, className)}>
      <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>{title}</h2>
      <div className={cn(commonStyles.listContainer, themeStyles.listContainer)} role="region" aria-label={title}>
        {loading && <div className={commonStyles.loadingState}>Loading...</div>}
        {!loading && items.length > 0 && items.map(renderItem)}
        {!loading && items.length === 0 && (
          <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
            {emptyStateMessage}
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentActivityFeed;
