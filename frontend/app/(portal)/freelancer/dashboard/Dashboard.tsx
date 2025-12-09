// @AI-HINT: Redesigned Freelancer Dashboard with modern UI/UX
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useFreelancerData } from '@/hooks/useFreelancer';
import Button from '@/app/components/Button/Button';
import { 
  Briefcase, 
  DollarSign, 
  FileText, 
  Eye,
  TrendingUp, 
  TrendingDown, 
  Search,
  ArrowRight,
  Clock
} from 'lucide-react';

import commonStyles from './Dashboard.common.module.css';
import lightStyles from './Dashboard.light.module.css';
import darkStyles from './Dashboard.dark.module.css';

interface StatCardProps {
  title: string;
  value: string;
  trend?: number;
  icon: React.ElementType;
  themeStyles: any;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, icon: Icon, themeStyles }) => {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;
  
  return (
    <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
      <div className={cn(commonStyles.statHeader, themeStyles.statHeader)}>
        <span>{title}</span>
        <Icon size={20} />
      </div>
      <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{value}</div>
      {trend !== undefined && (
        <div className={cn(commonStyles.statTrend, isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-gray-500')}>
          {isPositive ? <TrendingUp size={16} /> : isNegative ? <TrendingDown size={16} /> : null}
          <span>{Math.abs(trend)}% from last month</span>
        </div>
      )}
    </div>
  );
};

interface JobCardProps {
  job: any;
  themeStyles: any;
}

const JobCard: React.FC<JobCardProps> = ({ job, themeStyles }) => {
  return (
    <div className={cn(commonStyles.jobCard, themeStyles.jobCard)}>
      <div className={commonStyles.jobHeader}>
        <div>
          <h3 className={cn(commonStyles.jobTitle, themeStyles.jobTitle)}>{job.title}</h3>
          <span className={cn(commonStyles.jobClient, themeStyles.jobClient)}>{job.clientName}</span>
        </div>
        <div className={cn(commonStyles.jobBudget, themeStyles.jobBudget)}>${job.budget.toLocaleString()}</div>
      </div>
      <div className={commonStyles.jobTags}>
        {job.skills.slice(0, 3).map((skill: string) => (
          <span key={skill} className={cn(commonStyles.tag, themeStyles.tag)}>{skill}</span>
        ))}
      </div>
      <div className={cn(commonStyles.jobFooter, themeStyles.jobFooter)}>
        <div className="flex items-center gap-1 text-sm opacity-70">
          <Clock size={14} />
          <span>Posted {new Date(job.postedTime).toLocaleDateString()}</span>
        </div>
        <Link href={`/jobs/${job.id}`}>
          <Button variant="outline" size="sm">View Job</Button>
        </Link>
      </div>
    </div>
  );
};

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
          themeStyles={themeStyles} 
        />
        <StatCard 
          title="Active Jobs" 
          value={metrics.activeJobs.toString()} 
          trend={0} 
          icon={Briefcase} 
          themeStyles={themeStyles} 
        />
        <StatCard 
          title="Proposals Sent" 
          value={metrics.proposalsSent.toString()} 
          trend={12.0} 
          icon={FileText} 
          themeStyles={themeStyles} 
        />
        <StatCard 
          title="Profile Views" 
          value={metrics.profileViews.toString()} 
          trend={-5.0} 
          icon={Eye} 
          themeStyles={themeStyles} 
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
              <div className="p-4 text-center text-gray-500">Loading jobs...</div>
            ) : jobs && jobs.length > 0 ? (
              jobs.slice(0, 3).map((job: any) => (
                <JobCard key={job.id} job={job} themeStyles={themeStyles} />
              ))
            ) : (
              <div className="p-8 text-center border border-dashed rounded-lg border-gray-300 dark:border-gray-700">
                <p className="text-gray-500 mb-4">No jobs found matching your skills.</p>
                <Link href="/profile">
                  <Button variant="outline" size="sm">Update Profile</Button>
                </Link>
              </div>
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
             {/* Mock Proposals */}
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
