// @AI-HINT: This is the modernized 'My Jobs' page. It uses the reusable PaginatedJobGrid component to display active and completed jobs, resulting in a clean, maintainable, and premium implementation.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import PaginatedJobGrid from './components/PaginatedJobGrid/PaginatedJobGrid';
import { JobStatusCardProps } from './components/JobStatusCard/JobStatusCard';
import { SortOption } from '@/app/components/DataToolbar/DataToolbar';

import commonStyles from './MyJobs.common.module.css';
import lightStyles from './MyJobs.light.module.css';
import darkStyles from './MyJobs.dark.module.css';

// Mock data - in a real app, this would come from an API
const activeJobs: JobStatusCardProps[] = [
  {
    title: 'AI-Powered Content Generation Platform',
    client: 'ContentAI Solutions',
    status: 'Development',
    progress: 65,
  },
  {
    title: 'Real-Time IoT Data Visualization Dashboard',
    client: 'Connected Devices Inc.',
    status: 'Client Review',
    progress: 90,
  },
  {
    title: 'Mobile App for Financial Literacy',
    client: 'FinEd Mobile',
    status: 'UI/UX Design',
    progress: 40,
  },
];

const completedJobs: JobStatusCardProps[] = [
  {
    title: 'Corporate Website Redesign',
    client: 'Global Synergy Corp',
    status: 'Completed',
    progress: 100,
    completionDate: '2025-08-01',
  },
  {
    title: 'Cloud Migration & Infrastructure Setup',
    client: 'ScaleFast Startups',
    status: 'Completed',
    progress: 100,
    completionDate: '2025-07-22',
  },
];

const activeSortOptions: SortOption[] = [
  { value: 'progress:desc', label: 'Progress: High to Low' },
  { value: 'progress:asc', label: 'Progress: Low to High' },
  { value: 'title:asc', label: 'Title A–Z' },
  { value: 'title:desc', label: 'Title Z–A' },
  { value: 'client:asc', label: 'Client A–Z' },
  { value: 'client:desc', label: 'Client Z–A' },
];

const completedSortOptions: SortOption[] = [
  { value: 'completionDate:desc', label: 'Newest' },
  { value: 'completionDate:asc', label: 'Oldest' },
  { value: 'title:asc', label: 'Title A–Z' },
  { value: 'title:desc', label: 'Title Z–A' },
  { value: 'client:asc', label: 'Client A–Z' },
  { value: 'client:desc', label: 'Client Z–A' },
];

const MyJobs: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.container, styles.container)}>
      <header className={cn(commonStyles.header, styles.header)}>
        <h1 className={cn(commonStyles.title, styles.title)}>My Jobs</h1>
        <p className={cn(commonStyles.subtitle, styles.subtitle)}>Track your active projects and review completed work.</p>
      </header>

      <div className={cn(commonStyles.gridsContainer, styles.gridsContainer)}>
        <PaginatedJobGrid
          storageKey="freelancer:my-jobs:active"
          jobs={activeJobs}
          sortOptions={activeSortOptions}
          defaultSortKey="progress"
          searchKeys={['title', 'client', 'status']}
          title="Active Jobs"
        />
        <PaginatedJobGrid
          storageKey="freelancer:my-jobs:completed"
          jobs={completedJobs}
          sortOptions={completedSortOptions}
          defaultSortKey="completionDate"
          searchKeys={['title', 'client', 'completionDate']}
          title="Completed Jobs"
        />
      </div>
    </div>
  );
};

export default MyJobs;
