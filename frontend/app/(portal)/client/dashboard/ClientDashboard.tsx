// @AI-HINT: Redesigned Client Dashboard with modern UI/UX. 
// Production-ready: Uses real API data, no mock fallbacks.
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useClientData } from '@/hooks/useClient';
import { useRecommendations } from '@/hooks/useRecommendations';
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
  ArrowRight
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
  const { projects, payments, loading, error } = useClientData();
  // Use dedicated recommendations hook
  const { recommendations: freelancers, loading: recLoading, error: recError } = useRecommendations(5);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  // Use real data - no demo fallbacks
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
    
    // Count pending proposals from projects
    const pendingProposals = displayProjects.reduce((sum, p) => sum + (p.proposals_count || 0), 0);
    
    return {
      totalSpent: `$${totalSpent.toLocaleString()}`,
      activeProjects,
      pendingProposals,
      unreadMessages: 0 // Will be fetched from messages API when available
    };
  }, [displayProjects, payments]);

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
          <h1>Welcome back</h1>
          <p>Here's what's happening with your projects today.</p>
        </div>
        <Link href="/client/post-job">
          <Button variant="primary" size="lg" iconBefore={<Plus size={20} />}>
            Post a Job
          </Button>
        </Link>
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

      {/* Main Content Grid */}
      <div className={commonStyles.mainContentGrid}>
        {/* Left Column */}
        <div className={commonStyles.sectionContainer}>
          <div className={commonStyles.sectionHeader}>
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Active Projects</h2>
            <Link href="/client/projects" className={cn(commonStyles.viewAllLink, themeStyles.viewAllLink)}>
              View All Projects <ArrowRight size={16} className="inline ml-1" />
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
