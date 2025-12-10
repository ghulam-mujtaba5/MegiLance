// @AI-HINT: Redesigned Freelancer Dashboard with modern UI/UX including Seller Stats
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
import SellerStats, { SellerStatsData } from '@/app/components/SellerStats/SellerStats';
import JobCard from './components/JobCard';
import { 
  Briefcase, 
  DollarSign, 
  FileText, 
  Eye,
  Search,
  ArrowRight,
  Package
} from 'lucide-react';

import commonStyles from './Dashboard.common.module.css';
import lightStyles from './Dashboard.light.module.css';
import darkStyles from './Dashboard.dark.module.css';

// Mock seller stats for demo
const getMockSellerStats = (): SellerStatsData => ({
  userId: 1,
  level: {
    level: 'silver',
    jssScore: 92,
    levelProgress: {
      nextLevel: 'Gold Seller',
      requirements: {
        completedOrders: { current: 45, required: 50, percent: 90 },
        earnings: { current: 4500, required: 5000, percent: 90 },
        rating: { current: 4.8, required: 4.9, percent: 98 },
        onTimeDelivery: { current: 95, required: 98, percent: 97 },
      },
    },
    benefits: {
      commissionRate: 15,
      featuredGigs: 2,
      prioritySupport: true,
      badges: ['trusted', 'fast_delivery'],
      description: 'Silver sellers enjoy reduced fees and featured placement.',
    },
  },
  totalOrders: 52,
  completedOrders: 45,
  cancelledOrders: 3,
  averageRating: 4.8,
  totalReviews: 38,
  completionRate: 86.5,
  onTimeDeliveryRate: 95,
  responseRate: 98,
  avgResponseTimeHours: 1.5,
  totalEarnings: 4500,
  uniqueClients: 35,
  repeatClients: 12,
  repeatClientRate: 34.3,
  ordersChange: 15,
  earningsChange: 22,
  ratingChange: 0.1,
});

const Dashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { analytics, recommendedJobs, proposals, loading } = useFreelancerData();
  const [sellerStats, setSellerStats] = useState<SellerStatsData | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Fetch seller stats from API
    const fetchSellerStats = async () => {
      try {
        const response = await fetch('/backend/api/seller-stats/me', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setSellerStats(data);
        } else {
          // Use mock data for demo
          setSellerStats(getMockSellerStats());
        }
      } catch (error) {
        setSellerStats(getMockSellerStats());
      }
    };
    
    fetchSellerStats();
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
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/freelancer/gigs">
            <Button variant="outline" size="lg" iconBefore={<Package size={20} />}>
              My Gigs
            </Button>
          </Link>
          <Link href="/jobs">
            <Button variant="primary" size="lg" iconBefore={<Search size={20} />}>
              Find Work
            </Button>
          </Link>
        </div>
      </div>

      {/* Seller Stats Section */}
      {sellerStats && (
        <SellerStats stats={sellerStats} />
      )}

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
            ) : recommendedJobs && recommendedJobs.length > 0 ? (
              recommendedJobs.slice(0, 3).map((job: any) => (
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
            {proposals && proposals.length > 0 ? (
              proposals.slice(0, 5).map((proposal) => (
                <div key={proposal.id} className={cn(commonStyles.proposalCard, themeStyles.proposalCard)}>
                  <div className={commonStyles.proposalInfo}>
                    <div className={cn(commonStyles.proposalInfo, themeStyles.proposalInfo)}>
                      <h4>{proposal.projectTitle}</h4>
                    </div>
                    <span className="text-xs opacity-70">
                      {new Date(proposal.sentDate).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={cn(commonStyles.proposalStatus, themeStyles.proposalStatus)}>
                    {proposal.status}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                title="No proposals yet"
                description="Start applying to jobs to see them here."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
