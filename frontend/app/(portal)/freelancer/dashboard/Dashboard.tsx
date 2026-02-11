// @AI-HINT: Redesigned Freelancer Dashboard with modern UI/UX, quick actions, seller stats
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useFreelancerData } from '@/hooks/useFreelancer';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/app/components/Button/Button';
import Loading from '@/app/components/Loading/Loading';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { searchingAnimation, emptyBoxAnimation } from '@/app/components/Animations/LottieAnimation';
import StatCard from '@/app/components/StatCard/StatCard';
import SellerStats, { SellerStatsData } from '@/app/components/SellerStats/SellerStats';
import EarningsChart from './components/EarningsChart/EarningsChart';
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
  BarChart3
} from 'lucide-react';

import commonStyles from './Dashboard.common.module.css';
import lightStyles from './Dashboard.light.module.css';
import darkStyles from './Dashboard.dark.module.css';

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  new_seller: 'Welcome! Complete orders and build your reputation to level up.',
  bronze: 'Rising seller with a proven track record.',
  silver: 'Experienced seller delivering great results.',
  gold: 'Top-rated seller with an outstanding reputation.',
  platinum: 'Elite seller — among the very best on the platform.',
};

const BASE_COMMISSION = 20;

/** Map flat backend /seller-stats/me response → SellerStatsData expected by <SellerStats>. */
function transformSellerStats(raw: Record<string, unknown>): SellerStatsData {
  const level = (raw.level as string) || 'new_seller';
  const benefits = (raw.benefits ?? {}) as Record<string, unknown>;
  const levelProgress = raw.level_progress as Record<string, unknown> | null;

  return {
    userId: raw.user_id as number,
    level: {
      level: level as SellerStatsData['level']['level'],
      jssScore: (raw.jss_score as number) ?? 0,
      benefits: {
        commissionRate: BASE_COMMISSION - ((benefits.reduced_fees as number) ?? 0),
        featuredGigs: (benefits.featured_gigs as number) ?? 0,
        prioritySupport: (benefits.priority_support as boolean) ?? false,
        badges: (raw.badges as string[]) ?? (benefits.badges as string[]) ?? [],
        description: LEVEL_DESCRIPTIONS[level] ?? LEVEL_DESCRIPTIONS.new_seller,
      },
      ...(levelProgress
        ? {
            levelProgress: {
              nextLevel: levelProgress.next_level as string,
              requirements: levelProgress.requirements as Record<string, { current: number; required: number; percent: number }>,
            },
          }
        : {}),
    },
    totalOrders: (raw.total_orders as number) ?? 0,
    completedOrders: (raw.completed_orders as number) ?? 0,
    cancelledOrders: (raw.cancelled_orders as number) ?? 0,
    averageRating: (raw.average_rating as number) ?? 0,
    totalReviews: (raw.total_reviews as number) ?? 0,
    completionRate: (raw.completion_rate as number) ?? 100,
    onTimeDeliveryRate: (raw.on_time_delivery_rate as number) ?? 100,
    responseRate: (raw.response_rate as number) ?? 100,
    avgResponseTimeHours: (raw.avg_response_time_hours as number) ?? 0,
    totalEarnings: (raw.total_earnings as number) ?? 0,
    uniqueClients: (raw.unique_clients as number) ?? 0,
    repeatClients: (raw.repeat_clients as number) ?? 0,
    repeatClientRate: (raw.repeat_client_rate as number) ?? 0,
  };
}

const Dashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { analytics, recommendedJobs, proposals, loading } = useFreelancerData();
  const { user } = useAuth();
  const [sellerStats, setSellerStats] = useState<SellerStatsData | null>(null);
  const [earningsData, setEarningsData] = useState<{ month: string; amount: number }[]>([]);

  useEffect(() => {
    setMounted(true);
    
    const fetchSellerStats = async () => {
      try {
        const token = sessionStorage.getItem('auth_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch('/api/seller-stats/me', {
          credentials: 'include',
          headers,
        });
        if (response.ok) {
          const data = await response.json();
          setSellerStats(transformSellerStats(data));
        }
      } catch {
        // Seller stats are optional - don't block dashboard
      }
    };

    const fetchEarnings = async () => {
      try {
        const token = sessionStorage.getItem('auth_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch('/api/portal/freelancer/earnings/monthly?months=6', {
          credentials: 'include',
          headers,
        });
        if (response.ok) {
          const data = await response.json();
          setEarningsData(data.earnings || []);
        }
      } catch {
        // Earnings chart is optional
      }
    };
    
    fetchSellerStats();
    fetchEarnings();
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
      <div className={cn(commonStyles.dashboardContainer, commonStyles.loadingContainer)}>
        <Loading />
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.dashboardContainer, themeStyles.dashboardContainer)}>
      {/* Header Section */}
      <div className={commonStyles.headerSection}>
        <div className={cn(commonStyles.welcomeText, themeStyles.welcomeText)}>
          <h1>Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
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

      {/* Earnings Chart */}
      {earningsData.length > 0 && (
        <div className={commonStyles.sectionContainer}>
          <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Monthly Earnings</h2>
          <EarningsChart data={earningsData} />
        </div>
      )}

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
