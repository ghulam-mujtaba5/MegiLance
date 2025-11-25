// @AI-HINT: This is the modernized Freelancer Dashboard root component. It orchestrates several child components to create a modular, maintainable, and premium user experience. All data comes from backend APIs via useFreelancerData hook.
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useFreelancerData } from '@/hooks/useFreelancer';
import { 
  Briefcase, 
  DollarSign, 
  FileText, 
  Bell,
  Calendar,
  MessageCircle,
  Plus,
  Award,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import KeyMetricsGrid from '@/app/(portal)/freelancer/dashboard/components/KeyMetricsGrid/KeyMetricsGrid';
import RecentActivityFeed from '@/app/(portal)/freelancer/dashboard/components/RecentActivityFeed/RecentActivityFeed';
import ProjectCard from '@/app/components/ProjectCard/ProjectCard';
import TransactionRow from '@/app/components/TransactionRow/TransactionRow';
import Button from '@/app/components/Button/Button';
import Card from '@/app/components/Card/Card';

import commonStyles from './Dashboard.common.module.css';
import lightStyles from './Dashboard.light.module.css';
import darkStyles from './Dashboard.dark.module.css';

const Dashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const { analytics, jobs, transactions, loading, error } = useFreelancerData();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const renderJobItem = (job: any) => (
      <ProjectCard
        key={job.id}
        id={job.id ?? 'unknown'}
        title={job.title ?? 'Untitled Job'}
        status={job.status ?? 'Pending'}
        progress={job.progress ?? 0}
        budget={typeof job.budget === 'number' ? job.budget : 0}
        paid={job.paid ?? 0}
        freelancers={job.freancers ?? []}
        updatedAt={job.updatedAt ?? ''}
        clientName={job.clientName ?? 'Unknown Client'}
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

  // Generate dynamic activity from real data
  const recentActivity = useMemo(() => {
    const activities: Array<{
      id: string;
      title: string;
      description: string;
      time: string;
      icon: typeof Briefcase;
      type: 'job' | 'payment' | 'proposal' | 'message';
    }> = [];

    // Add activities from jobs
    if (jobs && jobs.length > 0) {
      jobs.slice(0, 2).forEach((job: any, index: number) => {
        activities.push({
          id: `job-${job.id || index}`,
          title: 'New job available',
          description: job.title || 'A new job matching your skills was posted',
          time: job.postedTime || 'Recently',
          icon: Briefcase,
          type: 'job'
        });
      });
    }

    // Add activities from transactions
    if (transactions && transactions.length > 0) {
      transactions.slice(0, 2).forEach((txn: any, index: number) => {
        activities.push({
          id: `txn-${txn.id || index}`,
          title: txn.amount?.startsWith('+') ? 'Payment received' : 'Payment processed',
          description: txn.description || `Transaction of ${txn.amount}`,
          time: txn.date || 'Recently',
          icon: DollarSign,
          type: 'payment'
        });
      });
    }

    // Add analytics-based activities
    if (analytics) {
      if (analytics.pendingProposals > 0) {
        activities.push({
          id: 'proposals',
          title: 'Pending proposals',
          description: `You have ${analytics.pendingProposals} proposal(s) awaiting response`,
          time: 'Active',
          icon: FileText,
          type: 'proposal'
        });
      }
      if (analytics.activeProjects > 0) {
        activities.push({
          id: 'active',
          title: 'Active projects',
          description: `${analytics.activeProjects} project(s) currently in progress`,
          time: 'Ongoing',
          icon: Clock,
          type: 'job'
        });
      }
    }

    // Fallback if no real data
    if (activities.length === 0) {
      activities.push({
        id: 'welcome',
        title: 'Welcome to MegiLance!',
        description: 'Start by browsing available jobs or setting up your profile',
        time: 'Just now',
        icon: Award,
        type: 'message'
      });
    }

    return activities.slice(0, 5);
  }, [jobs, transactions, analytics]);

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      {/* Welcome Banner */}
      <div className={cn(commonStyles.welcomeBanner, themeStyles.welcomeBanner)}>
        <div className={commonStyles.welcomeBannerContent}>
          <h1 className={cn(commonStyles.welcomeBannerTitle, themeStyles.welcomeBannerTitle)}>
            Welcome back! 👋
          </h1>
          <p className={cn(commonStyles.welcomeBannerText, themeStyles.welcomeBannerText)}>
            Here&apos;s what&apos;s happening with your projects and earnings today.
          </p>
          <div className={commonStyles.quickActions}>
            <Link href="/jobs">
              <Button variant="primary" size="md" iconBefore={<Plus size={18} />}>
                Browse Jobs
              </Button>
            </Link>
            <Link href="/freelancer/proposals">
              <Button variant="secondary" size="md" iconBefore={<FileText size={18} />}>
                My Proposals
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className={cn(commonStyles.errorBanner, themeStyles.errorBanner)}>
          <AlertCircle size={20} />
          <span>Unable to load some data. Please refresh the page.</span>
        </div>
      )}

      {/* Key Metrics from API */}
      <KeyMetricsGrid analytics={analytics} loading={loading} />

      <div className={cn(commonStyles.mainContent, themeStyles.mainContent)}>
        {/* Recent Activity */}
        <div className={commonStyles.activitySection}>
          <Card title="Recent Activity" icon={Calendar}>
            <div className={commonStyles.activityList}>
              {loading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={commonStyles.activityItemSkeleton}>
                    <div className={commonStyles.skeletonIcon} />
                    <div className={commonStyles.skeletonContent}>
                      <div className={commonStyles.skeletonTitle} />
                      <div className={commonStyles.skeletonDesc} />
                    </div>
                  </div>
                ))
              ) : (
                recentActivity.map(activity => (
                  <div key={activity.id} className={cn(commonStyles.activityItem, themeStyles.activityItem)}>
                    <div className={cn(
                      commonStyles.activityIcon, 
                      themeStyles.activityIcon,
                      themeStyles[`activityIcon${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}`]
                    )}>
                      <activity.icon size={18} />
                    </div>
                    <div className={commonStyles.activityContent}>
                      <h4 className={cn(commonStyles.activityTitle, themeStyles.activityTitle)}>
                        {activity.title}
                      </h4>
                      <p className={cn(commonStyles.activityDescription, themeStyles.activityDescription)}>
                        {activity.description}
                      </p>
                      <span className={cn(commonStyles.activityTime, themeStyles.activityTime)}>
                        {activity.time}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Jobs and Transactions from API */}
        <RecentActivityFeed
          title="Available Jobs"
          items={jobs?.slice(0, 3) ?? []}
          renderItem={renderJobItem}
          loading={loading}
          emptyStateMessage="No jobs available at the moment. Check back soon!"
        />
        <RecentActivityFeed
          title="Recent Transactions"
          items={transactions?.slice(0, 5) ?? []}
          renderItem={renderTransactionItem}
          loading={loading}
          emptyStateMessage="No transactions yet. Complete a project to earn!"
        />
      </div>
    </div>
  );
};

export default Dashboard;