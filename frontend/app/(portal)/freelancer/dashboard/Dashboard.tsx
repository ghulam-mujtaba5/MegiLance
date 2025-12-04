// @AI-HINT: This is the modernized Freelancer Dashboard root component. It orchestrates several child components to create a modular, maintainable, and premium user experience. All data comes from backend APIs via useFreelancerData hook.
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useFreelancerData, FreelancerJob, FreelancerTransaction } from '@/hooks/useFreelancer';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer } from '@/app/components/Animations/StaggerContainer';
import { 
  Briefcase, 
  DollarSign, 
  FileText, 
  Calendar,
  Plus,
  Award,
  Clock,
  AlertCircle,
  MapPin
} from 'lucide-react';

import KeyMetricsGrid from '@/app/(portal)/freelancer/dashboard/components/KeyMetricsGrid/KeyMetricsGrid';
import RecentActivityFeed from '@/app/(portal)/freelancer/dashboard/components/RecentActivityFeed/RecentActivityFeed';
import TransactionRow from '@/app/components/TransactionRow/TransactionRow';
import Button from '@/app/components/Button/Button';
import Card from '@/app/components/Card/Card';
import Badge from '@/app/components/Badge/Badge';

import commonStyles from './Dashboard.common.module.css';
import lightStyles from './Dashboard.light.module.css';
import darkStyles from './Dashboard.dark.module.css';

const Dashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const { analytics, jobs, transactions, loading, error } = useFreelancerData();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const renderJobItem = (job: FreelancerJob) => (
    <div className={cn(commonStyles.jobItem, themeStyles.jobItem)}>
      <div className={commonStyles.jobHeader}>
        <h4 className={cn(commonStyles.jobTitle, themeStyles.jobTitle)}>{job.title}</h4>
        <Badge variant="info" size="small">{job.status}</Badge>
      </div>
      <div className={commonStyles.jobDetails}>
        <span className={commonStyles.jobClient}>{job.clientName}</span>
        <span className={commonStyles.jobBudget}>${job.budget.toLocaleString()}</span>
      </div>
      <div className={commonStyles.jobFooter}>
        <div className={commonStyles.jobMeta}>
          <Clock size={14} className={commonStyles.jobIcon} />
          <span>{new Date(job.postedTime).toLocaleDateString()}</span>
        </div>
        {job.skills.length > 0 && (
          <div className={commonStyles.jobSkills}>
            {job.skills.slice(0, 2).map(skill => (
              <span key={skill} className={cn(commonStyles.skillTag, themeStyles.skillTag)}>{skill}</span>
            ))}
            {job.skills.length > 2 && <span className={cn(commonStyles.skillTag, themeStyles.skillTag)}>+{job.skills.length - 2}</span>}
          </div>
        )}
      </div>
      <Link href={`/jobs/${job.id}`} className={commonStyles.jobLink}>
        View Details
      </Link>
    </div>
  );

  const renderTransactionItem = (txn: FreelancerTransaction) => (
    <TransactionRow
      key={txn.id}
      amount={txn.amount}
      date={new Date(txn.date).toLocaleDateString()}
      description={txn.description}
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
      jobs.slice(0, 2).forEach((job, index) => {
        activities.push({
          id: `job-${job.id || index}`,
          title: 'New job available',
          description: job.title || 'A new job matching your skills was posted',
          time: new Date(job.postedTime).toLocaleDateString(),
          icon: Briefcase,
          type: 'job'
        });
      });
    }

    // Add activities from transactions
    if (transactions && transactions.length > 0) {
      transactions.slice(0, 2).forEach((txn, index) => {
        activities.push({
          id: `txn-${txn.id || index}`,
          title: txn.amount.startsWith('+') ? 'Payment received' : 'Payment processed',
          description: txn.description || `Transaction of ${txn.amount}`,
          time: new Date(txn.date).toLocaleDateString(),
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
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        {/* Welcome Banner */}
        <ScrollReveal>
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
        </ScrollReveal>

        {error && (
          <ScrollReveal>
            <div className={cn(commonStyles.errorBanner, themeStyles.errorBanner)}>
              <AlertCircle size={20} />
              <span>Unable to load some data. Please refresh the page.</span>
            </div>
          </ScrollReveal>
        )}

        {/* Key Metrics from API */}
        <ScrollReveal delay={0.1}>
          <KeyMetricsGrid analytics={analytics} loading={loading} />
        </ScrollReveal>

        <StaggerContainer delay={0.2} className={cn(commonStyles.mainContent, themeStyles.mainContent)}>
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
        </StaggerContainer>
      </div>
    </PageTransition>
  );
};

export default Dashboard;