// @AI-HINT: Redesigned Freelancer Dashboard with modern UI/UX
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useFreelancerData } from '@/hooks/useFreelancer';
import Button from '@/app/components/Button/Button';
import Loading from '@/app/components/Loading/Loading';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import StatCard from '@/app/components/StatCard/StatCard';
import JobCard from './components/JobCard';
import { 
  Briefcase, 
  DollarSign, 
  FileText, 
  Eye,
  Search,
  ArrowRight
} from 'lucide-react';

import commonStyles from './Dashboard.common.module.css';
import lightStyles from './Dashboard.light.module.css';
import darkStyles from './Dashboard.dark.module.css';

const Dashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { analytics, jobs, loading } = useFreelancerData();

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const metrics = useMemo(() => {
    return {
      earnings: analytics?.totalEarnings || '$0',
      activeJobs: analytics?.activeProjects || 0,
      proposalsSent: analytics?.pendingProposals || 0,
      profileViews: analytics?.profileViews || 0
    };
  }, [analytics]);

  if (!mounted) return null;

  return (
    <div className={cn(commonStyles.dashboardContainer, themeStyles.dashboardContainer)}>
      {/* Header Section */}
      <div className={commonStyles.headerSection}>
        <div className={cn(commonStyles.welcomeText, themeStyles.welcomeText)}>
          <h1>Welcome back, Freelancer</h1>
          <p>You have new job matches waiting for you.</p>
        </div>
        <Link href="/jobs">
          <Button variant="primary" size="lg" iconBefore={<Search size={20} />}>
            Find Work
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className={commonStyles.statsGrid}>
        <StatCard 
          title="Total Earnings" 
          value={metrics.earnings} 
          trend={8.5} 
          icon={DollarSign} 
        />
        <StatCard 
          title="Active Jobs" 
          value={metrics.activeJobs.toString()} 
          trend={0} 
          icon={Briefcase} 
        />
        <StatCard 
          title="Proposals Sent" 
          value={metrics.proposalsSent.toString()} 
          trend={12.0} 
          icon={FileText} 
        />
        <StatCard 
          title="Profile Views" 
          value={metrics.profileViews.toString()} 
          trend={-5.0} 
          icon={Eye} 
        />
      </div>

      {/* Main Content Grid */}
      <div className={commonStyles.mainContentGrid}>
        {/* Left Column */}
        <div className={commonStyles.sectionContainer}>
          <div className={commonStyles.sectionHeader}>
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Recommended Jobs</h2>
            <Link href="/jobs" className={cn(commonStyles.viewAllLink, themeStyles.viewAllLink)}>
              View All Jobs <ArrowRight size={16} className="inline ml-1" />
            </Link>
          </div>
          
          <div className={commonStyles.jobList}>
            {loading ? (
              <Loading />
            ) : jobs && jobs.length > 0 ? (
              jobs.slice(0, 3).map((job: any) => (
                <JobCard key={job.id} job={job} />
              ))
            ) : (
              <EmptyState
                title="No jobs found"
                description="We couldn't find any jobs matching your skills."
                action={
                  <Link href="/profile">
                    <Button variant="outline" size="sm">Update Profile</Button>
                  </Link>
                }
              />
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className={commonStyles.sectionContainer}>
          <div className={commonStyles.sectionHeader}>
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Recent Proposals</h2>
            <Link href="/proposals" className={cn(commonStyles.viewAllLink, themeStyles.viewAllLink)}>
              View All
            </Link>
          </div>

          <div className={commonStyles.proposalList}>
             {/* Mock Proposals - In a real app, this would come from API */}
             <div className={cn(commonStyles.proposalCard, themeStyles.proposalCard)}>
                <div className={commonStyles.proposalInfo}>
                   <div className={cn(commonStyles.proposalInfo, themeStyles.proposalInfo)}>
                      <h4>E-commerce Website Redesign</h4>
                   </div>
                   <span className="text-xs opacity-70">Sent 2 days ago</span>
                </div>
                <span className={cn(commonStyles.proposalStatus, themeStyles.proposalStatus)}>Pending</span>
             </div>
             <div className={cn(commonStyles.proposalCard, themeStyles.proposalCard)}>
                <div className={commonStyles.proposalInfo}>
                   <div className={cn(commonStyles.proposalInfo, themeStyles.proposalInfo)}>
                      <h4>Mobile App Development</h4>
                   </div>
                   <span className="text-xs opacity-70">Sent 5 days ago</span>
                </div>
                <span className={cn(commonStyles.proposalStatus, themeStyles.proposalStatus)}>Viewed</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
