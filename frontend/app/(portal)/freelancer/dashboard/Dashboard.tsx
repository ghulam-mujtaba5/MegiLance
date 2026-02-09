// @AI-HINT: Redesigned Freelancer Dashboard with modern UI/UX, quick actions, seller stats
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useFreelancerData } from '@/hooks/useFreelancer';
import Button from '@/app/components/Button/Button';
import Loading from '@/app/components/Loading/Loading';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { searchingAnimation, emptyBoxAnimation } from '@/app/components/Animations/LottieAnimation';
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
  Package,
  MessageSquare,
  User,
  Settings,
  BarChart3
} from 'lucide-react';

import commonStyles from './Dashboard.common.module.css';
import lightStyles from './Dashboard.light.module.css';
import darkStyles from './Dashboard.dark.module.css';

// Mock seller stats — used as fallback when API unavailable
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
    
    const fetchSellerStats = async () => {
      try {
        const response = await fetch('/backend/api/seller-stats/me', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setSellerStats(data);
        } else {
          setSellerStats(getMockSellerStats());
        }
      } catch {
        setSellerStats(getMockSellerStats());
      }
    };
    
    fetchSellerStats();
  }, []);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const metrics = useMemo(() => ({
    earnings: analytics?.totalEarnings || '$0',
    activeJobs: analytics?.activeProjects || 0,
    proposalsSent: analytics?.pendingProposals || 0,
    profileViews: analytics?.profileViews || 0,
  }), [analytics]);

  // Quick actions for the grid
  const quickActions = [
    { label: 'Find Work', href: '/jobs', icon: Search, color: 'primary' as const },
    { label: 'My Gigs', href: '/freelancer/gigs', icon: Package, color: 'success' as const },
    { label: 'Proposals', href: '/freelancer/proposals', icon: FileText, color: 'info' as const },
    { label: 'Messages', href: '/freelancer/messages', icon: MessageSquare, color: 'purple' as const },
    { label: 'Analytics', href: '/freelancer/analytics', icon: BarChart3, color: 'warning' as const },
    { label: 'Profile', href: '/freelancer/profile', icon: User, color: 'danger' as const },
  ];

  if (!mounted) {
    return (
      <div className={cn(commonStyles.dashboardContainer)} style={{ minHeight: '100vh', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.dashboardContainer, themeStyles.dashboardContainer)}>
      {/* Header Section */}
      <div className={commonStyles.headerSection}>
        <div className={cn(commonStyles.welcomeText, themeStyles.welcomeText)}>
          <h1>Welcome back, Freelancer</h1>
          <p>You have new job matches waiting for you.</p>
        </div>
        <div className={commonStyles.headerActions}>
          <Link href="/freelancer/gigs">
            <Button variant="outline" size="lg" iconBefore={<Package size={18} />}>
              My Gigs
            </Button>
          </Link>
          <Link href="/jobs">
            <Button variant="primary" size="lg" iconBefore={<Search size={18} />}>
              Find Work
            </Button>
          </Link>
        </div>
      </div>

      {/* Seller Stats Section */}
      {sellerStats && <SellerStats stats={sellerStats} />}

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

      {/* Quick Actions */}
      <div className={commonStyles.quickActionsSection}>
        <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Quick Actions</h2>
        <div className={commonStyles.quickActionsGrid}>
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href} className={cn(commonStyles.quickActionCard, themeStyles.quickActionCard)}>
              <div className={cn(commonStyles.quickActionIcon, commonStyles[`quickActionIcon-${action.color}`])}>
                <action.icon size={20} />
              </div>
              <span className={cn(commonStyles.quickActionLabel, themeStyles.quickActionLabel)}>{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={commonStyles.mainContentGrid}>
        {/* Left Column */}
        <div className={commonStyles.sectionContainer}>
          <div className={commonStyles.sectionHeader}>
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Recommended Jobs</h2>
            <Link href="/jobs" className={cn(commonStyles.viewAllLink, themeStyles.viewAllLink)}>
              View All <ArrowRight size={16} />
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
                description="We couldn&apos;t find any jobs matching your skills."
                animationData={searchingAnimation}
                animationWidth={120}
                animationHeight={120}
                action={
                  <Link href="/freelancer/profile">
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
            <Link href="/freelancer/proposals" className={cn(commonStyles.viewAllLink, themeStyles.viewAllLink)}>
              View All
            </Link>
          </div>

          <div className={commonStyles.proposalList}>
            {proposals && proposals.length > 0 ? (
              proposals.slice(0, 5).map((proposal) => (
                <div key={proposal.id} className={cn(commonStyles.proposalCard, themeStyles.proposalCard)}>
                  <div className={commonStyles.proposalInfo}>
                    <h4 className={cn(themeStyles.proposalTitle)}>{proposal.projectTitle}</h4>
                    <span className={cn(commonStyles.proposalDate, themeStyles.proposalDate)}>
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
                animationData={emptyBoxAnimation}
                animationWidth={100}
                animationHeight={100}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
