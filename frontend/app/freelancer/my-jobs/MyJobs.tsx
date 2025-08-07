// @AI-HINT: This is the refactored 'My Jobs' page, featuring a premium two-column layout and the specialized JobStatusCard for a clean, professional presentation.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import JobStatusCard from './components/JobStatusCard/JobStatusCard';
import commonStyles from './MyJobs.common.module.css';
import lightStyles from './MyJobs.light.module.css';
import darkStyles from './MyJobs.dark.module.css';

const activeJobs = [
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

const completedJobs = [
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

const MyJobs: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Jobs</h1>
        <p className={styles.subtitle}>
          Track and manage all your active and completed projects from one place.
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Active Jobs</h2>
        <div className={styles.jobGrid}>
          {activeJobs.map((job, index) => (
            <JobStatusCard key={`active-${index}`} {...job} />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Completed Jobs</h2>
        <div className={styles.jobGrid}>
          {completedJobs.map((job, index) => (
            <JobStatusCard key={`completed-${index}`} {...job} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default MyJobs;
