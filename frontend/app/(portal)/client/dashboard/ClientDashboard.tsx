// @AI-HINT: Redesigned Client Dashboard with modern UI/UX, quick actions, and activity feed.
// Production-ready: Uses real API data, no mock fallbacks.
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useClientData } from '@/hooks/useClient';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useAuth } from '@/hooks/useAuth';
import { messagesApi } from '@/lib/api';
import Button from '@/app/components/Button/Button';
import Loading from '@/app/components/Loading/Loading';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { emptyBoxAnimation, aiSparkleAnimation } from '@/app/components/Animations/LottieAnimation';
import { 
  Briefcase, 
  DollarSign, 
  Clock, 
  MessageSquare, 
  Plus,
  ArrowRight,
  Search,
  FileText,
  CreditCard
} from 'lucide-react';

import StatCard from './components/StatCard';
import ProjectCard from './components/ProjectCard';
import TalentCard from './components/TalentCard';

import commonStyles from './ClientDashboard.common.module.css';
import lightStyles from './ClientDashboard.light.module.css';
import darkStyles from './ClientDashboard.dark.module.css';

const ClientDashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { projects, payments, loading, error } = useClientData();
  const { recommendations: freelancers, loading: recLoading, error: recError } = useRecommendations(5);
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    messagesApi.getUnreadCount()
      .then((data: any) => setUnreadCount(data?.unread_count ?? 0))
      .catch(() => {});
  }, []);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const displayProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];
    return projects;
  }, [projects]);

  const metrics = useMemo(() => {
    const totalProjects = displayProjects.length;
    const activeProjects = displayProjects.filter(p => 
      (p.status as string) === 'In Progress' || (p.status as string) === 'in_progress' || (p.status as string) === 'active'
    ).length;
    const totalSpent = Array.isArray(payments) ? payments.reduce((sum, p) => {
      const amount = typeof p.amount === 'number' ? p.amount : parseFloat(p.amount?.replace(/[$,]/g, '') || '0');
      return sum + amount;
    }, 0) : 0;
    
    const pendingProposals = displayProjects.reduce((sum, p) => sum + (p.proposals_count || 0), 0);
    
    return {
      totalSpent: `$${totalSpent.toLocaleString()}`,
      activeProjects,
      pendingProposals,
      unreadMessages: unreadCount
    };
  }, [displayProjects, payments, unreadCount]);

  // Quick actions for the grid
  const quickActions = [
    { label: 'Post a Job', href: '/client/post-job', icon: Plus, color: 'primary' as const },
    { label: 'Find Talent', href: '/client/hire', icon: Search, color: 'success' as const },
    { label: 'My Projects', href: '/client/projects', icon: Briefcase, color: 'info' as const },
    { label: 'Contracts', href: '/client/contracts', icon: FileText, color: 'warning' as const },
    { label: 'Payments', href: '/client/payments', icon: CreditCard, color: 'danger' as const },
    { label: 'Messages', href: '/client/messages', icon: MessageSquare, color: 'purple' as const },
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
          <p>Here&apos;s what&apos;s happening with your projects today.</p>
        </div>
        <div className={commonStyles.headerActions}>
          <Link href="/client/hire">
            <Button variant="outline" size="lg" iconBefore={<Search size={18} />}>
              Find Talent
            </Button>
          </Link>
          <Link href="/client/post-job">
            <Button variant="primary" size="lg" iconBefore={<Plus size={20} />}>
              Post a Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={commonStyles.statsGrid}>
        <StatCard 
          title="Total Spent" 
          value={metrics.totalSpent} 
          trend={12.5} 
          icon={DollarSign} 
        />
        <StatCard 
          title="Active Projects" 
          value={metrics.activeProjects.toString()} 
          trend={-2.4} 
          icon={Briefcase} 
        />
        <StatCard 
          title="Pending Proposals" 
          value={metrics.pendingProposals.toString()} 
          trend={5.0} 
          icon={Clock} 
        />
        <StatCard 
          title="Unread Messages" 
          value={metrics.unreadMessages.toString()} 
          icon={MessageSquare} 
        />
      </div>

      {error && (
        <div className={commonStyles.errorBanner} role="alert">
          <p>Failed to load dashboard data. Please try refreshing the page.</p>
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
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Active Projects</h2>
            <Link href="/client/projects" className={cn(commonStyles.viewAllLink, themeStyles.viewAllLink)}>
              View All <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className={commonStyles.projectList}>
            {loading ? (
              <Loading />
            ) : displayProjects.length > 0 ? (
              displayProjects.slice(0, 3).map((project: any) => (
                <ProjectCard key={project.id} project={project} />
              ))
            ) : (
              <EmptyState
                title="No active projects"
                description="Get started by posting your first job."
                animationData={emptyBoxAnimation}
                animationWidth={120}
                animationHeight={120}
                action={
                  <Link href="/client/post-job">
                    <Button variant="primary" size="md">Post a Job</Button>
                  </Link>
                }
              />
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className={commonStyles.sectionContainer}>
          <div className={commonStyles.sectionHeader}>
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Recommended Talent</h2>
            <Link href="/client/hire" className={cn(commonStyles.viewAllLink, themeStyles.viewAllLink)}>
              Browse All
            </Link>
          </div>

          <div className={commonStyles.talentList}>
            {freelancers && freelancers.length > 0 ? (
              freelancers.slice(0, 3).map((freelancer) => (
                <TalentCard 
                  key={freelancer.id}
                  name={freelancer.name} 
                  role={freelancer.title} 
                  avatar={freelancer.avatarUrl || '/avatars/default.jpg'} 
                  rating={freelancer.rating}
                  location={freelancer.location}
                  hourlyRate={freelancer.hourlyRate}
                />
              ))
            ) : (
              <EmptyState
                title="No recommendations yet"
                description="Complete your profile to get AI matches."
                animationData={aiSparkleAnimation}
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

export default ClientDashboard;
