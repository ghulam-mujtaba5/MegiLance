// @AI-HINT: This is the Freelancer Dashboard root component. It serves as the main hub for freelancers, now fully refactored with theme-aware CSS modules for a premium, responsive experience.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import DashboardWidget from '@/app/components/DashboardWidget/DashboardWidget';
import ProjectCard from '@/app/components/ProjectCard/ProjectCard';
import TransactionRow from '@/app/components/TransactionRow/TransactionRow';

import commonStyles from './Dashboard.common.module.css';
import lightStyles from './Dashboard.light.module.css';
import darkStyles from './Dashboard.dark.module.css';

const Dashboard: React.FC = () => {
  const { theme } = useTheme();

  const styles = useMemo(() => {
    const themeStyles = theme === 'light' ? lightStyles : darkStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Welcome back, Freelancer!</h1>
        <p className={styles.subtitle}>Here’s what’s happening with your projects today.</p>
      </header>

      <div className={styles.widgetsGrid}>
        <DashboardWidget title="Active Projects" value="3" />
        <DashboardWidget title="Pending Proposals" value="5" />
        <DashboardWidget title="Wallet Balance" value="$1,234.56" />
        <DashboardWidget title="Freelancer Rank" value="Top 10%" />
      </div>

      <div className={styles.mainContent}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent Job Postings</h2>
          <div className={styles.projectList}>
            <ProjectCard
              title="AI Chatbot Integration"
              clientName="Innovate Inc."
              budget="$5,000"
              postedTime="2 hours ago"
              tags={['React', 'AI', 'NLP']}
            />
            <ProjectCard
              title="E-commerce Platform UI/UX"
              clientName="Shopify Plus Experts"
              budget="$8,000"
              postedTime="1 day ago"
              tags={['UI/UX', 'Figma', 'Next.js']}
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent Transactions</h2>
          <div className={styles.transactionList}>
            <TransactionRow amount="500" date="2025-08-03" description="Milestone 1 for Project X" />
            <TransactionRow amount="-200" date="2025-08-01" description="Withdrawal to bank" />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
