// @AI-HINT: Redesigned Client Dashboard with modern UI/UX. Features a responsive grid layout, key metrics, active projects, and recommended talent.
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useClientData } from '@/hooks/useClient';
import Button from '@/app/components/Button/Button';
import Loading from '@/app/components/Loading/Loading';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { 
  Briefcase, 
  DollarSign, 
  Clock, 
  MessageSquare, 
  Plus,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

import StatCard from './components/StatCard';
import ProjectCard from './components/ProjectCard';
import TalentCard from './components/TalentCard';

import commonStyles from './ClientDashboard.common.module.css';
import lightStyles from './ClientDashboard.light.module.css';
import darkStyles from './ClientDashboard.dark.module.css';

// Mock demo projects for when API fails
const demoProjects = [
  { id: '1', title: 'E-Commerce Website Redesign', status: 'In Progress', budget: '$5,000', progress: 65, proposals_count: 12, deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '2', title: 'Mobile App Development', status: 'Open', budget: '$15,000', progress: 0, proposals_count: 24, deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '3', title: 'Brand Identity Package', status: 'In Progress', budget: '$2,500', progress: 85, proposals_count: 8, deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
];

const ClientDashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { projects, payments, loading, error } = useClientData();

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  // Use demo data when API fails or returns empty
  const displayProjects = useMemo(() => {
    if (!Array.isArray(projects) || projects.length === 0) {
      return demoProjects;
    }
    return projects;
  }, [projects]);

  const metrics = useMemo(() => {
    const totalProjects = displayProjects.length;
    const activeProjects = displayProjects.filter(p => p.status === 'In Progress').length;
    const totalSpent = Array.isArray(payments) ? payments.reduce((sum, p) => {
      const amount = parseFloat(p.amount?.replace(/[$,]/g, '') || '0');
      return sum + amount;
    }, 0) : 12450;
    
    return {
      totalSpent: `$${totalSpent.toLocaleString()}`,
      activeProjects: activeProjects || 2,
      pendingProposals: 12, // Mock data
      unreadMessages: 5 // Mock data
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
          <h1>Good morning, Client</h1>
          <p>Here's what's happening with your projects today.</p>
        </div>
        <Link href="/client/post-job">
          <Button variant="primary" size="lg" iconBefore={<Plus size={20} />}>
            Post a Job
          </Button>
        </Link>
      </div>

      {/* Error Notice (if any) */}
      {error && (
        <div style={{ 
          background: 'rgba(234, 179, 8, 0.1)', 
          border: '1px solid rgba(234, 179, 8, 0.3)', 
          borderRadius: '8px', 
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} style={{ color: '#eab308' }} />
          <span style={{ color: '#ca8a04' }}>
            Using demo data. Connect to the backend for live data.
          </span>
        </div>
      )}

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
            <TalentCard 
              name="Sarah Wilson" 
              role="Senior UX Designer" 
              avatar="/avatars/sarah.jpg" 
              rating={4.9}
              location="New York, USA"
              hourlyRate="$85"
            />
            <TalentCard 
              name="Michael Chen" 
              role="Full Stack Developer" 
              avatar="/avatars/michael.jpg" 
              rating={5.0}
              location="San Francisco, USA"
              hourlyRate="$120"
            />
            <TalentCard 
              name="Emma Davis" 
              role="Content Strategist" 
              avatar="/avatars/emma.jpg" 
              rating={4.8}
              location="London, UK"
              hourlyRate="$65"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
