// @AI-HINT: This is the modernized Freelancer Dashboard root component. It orchestrates several child components to create a modular, maintainable, and premium user experience.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useFreelancerData } from '@/hooks/useFreelancer';

import KeyMetricsGrid from '@/app/(portal)/freelancer/dashboard/components/KeyMetricsGrid/KeyMetricsGrid';
import RecentActivityFeed from '@/app/(portal)/freelancer/dashboard/components/RecentActivityFeed/RecentActivityFeed';
import ProjectCard from '@/app/components/ProjectCard/ProjectCard';
import TransactionRow from '@/app/components/TransactionRow/TransactionRow';

import commonStyles from './Dashboard.common.module.css';
import lightStyles from './Dashboard.light.module.css';
import darkStyles from './Dashboard.dark.module.css';

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const { analytics, jobs, transactions, loading, error } = useFreelancerData();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  const renderJobItem = (job: any) => (
    <ProjectCard
      key={job.id}
      title={job.title ?? 'Untitled Job'}
      clientName={job.clientName ?? 'Unknown Client'}
      budget={job.budget ?? '$0'}
      postedTime={job.postedTime ?? 'Unknown'}
      tags={Array.isArray(job.skills) ? job.skills : []}
    />
  );

  const renderTransactionItem = (txn: any) => (
    <TransactionRow
      key={txn.id}
      amount={txn.amount ?? '0'}
      date={txn.date ?? ''}
      description={txn.description ?? 'Unknown transaction'}
    />
  );

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <header className={cn(commonStyles.header, themeStyles.header)}>
        <h1 className={cn(commonStyles.title, themeStyles.title)}>Welcome back!</h1>
        <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>Here&apos;s what&apos;s happening with your work today.</p>
      </header>

      {error && <div className={commonStyles.error}>Failed to load dashboard data. Please try again later.</div>}

      <KeyMetricsGrid analytics={analytics} loading={loading} />

      <div className={cn(commonStyles.mainContent, themeStyles.mainContent)}>
        <RecentActivityFeed
          title="Recent Job Postings"
          items={jobs?.slice(0, 3) ?? []}
          renderItem={renderJobItem}
          loading={loading}
          emptyStateMessage="No recent job postings found."
        />
        <RecentActivityFeed
          title="Recent Transactions"
          items={transactions?.slice(0, 5) ?? []}
          renderItem={renderTransactionItem}
          loading={loading}
          emptyStateMessage="No recent transactions found."
        />
      </div>
    </div>
  );
};

export default Dashboard;
