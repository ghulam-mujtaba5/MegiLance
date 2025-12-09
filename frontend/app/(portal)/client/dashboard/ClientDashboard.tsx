// @AI-HINT: Redesigned Client Dashboard with modern UI/UX. Features a responsive grid layout, key metrics, active projects, and recommended talent.
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useClientData } from '@/hooks/useClient';
import Button from '@/app/components/Button/Button';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import { 
  Briefcase, 
  DollarSign, 
  Clock, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  MoreHorizontal,
  Plus,
  ArrowRight
} from 'lucide-react';

import commonStyles from './ClientDashboard.common.module.css';
import lightStyles from './ClientDashboard.light.module.css';
import darkStyles from './ClientDashboard.dark.module.css';

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

interface ProjectCardProps {
  project: any;
  themeStyles: any;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, themeStyles }) => {
  return (
    <div className={cn(commonStyles.projectCard, themeStyles.projectCard)}>
      <div className={commonStyles.projectInfo}>
        <div className={cn(commonStyles.projectInfo, themeStyles.projectInfo)}>
          <h3>{project.title}</h3>
        </div>
        <div className={cn(commonStyles.projectMeta, themeStyles.projectMeta)}>
          <span>Due {new Date(project.deadline || Date.now()).toLocaleDateString()}</span>
          <span>•</span>
          <span>{project.proposals_count || 0} Proposals</span>
        </div>
      </div>
      <div className={cn(commonStyles.projectStatus, 
        project.status === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 
        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      )}>
        {project.status}
      </div>
    </div>
  );
};

interface TalentCardProps {
  name: string;
  role: string;
  avatar: string;
  themeStyles: any;
}

const TalentCard: React.FC<TalentCardProps> = ({ name, role, avatar, themeStyles }) => {
  return (
    <div className={cn(commonStyles.talentCard, themeStyles.talentCard)}>
      <UserAvatar name={name} src={avatar} size="md" />
      <div className={commonStyles.talentInfo}>
        <div className={cn(commonStyles.talentInfo, themeStyles.talentInfo)}>
          <h4>{name}</h4>
        </div>
        <div className={cn(commonStyles.talentRole, themeStyles.talentRole)}>{role}</div>
      </div>
      <button className={cn(commonStyles.actionButton, themeStyles.actionButton)} aria-label="More options">
        <MoreHorizontal size={20} />
      </button>
    </div>
  );
};

const ClientDashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { projects, payments, loading } = useClientData();

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const metrics = useMemo(() => {
    const totalProjects = Array.isArray(projects) ? projects.length : 0;
    const activeProjects = Array.isArray(projects) ? projects.filter(p => p.status === 'In Progress').length : 0;
    const totalSpent = Array.isArray(payments) ? payments.reduce((sum, p) => {
      const amount = parseFloat(p.amount?.replace(/[$,]/g, '') || '0');
      return sum + amount;
    }, 0) : 0;
    
    return {
      totalSpent: `$${totalSpent.toLocaleString()}`,
      activeProjects,
      pendingProposals: 12, // Mock data
      unreadMessages: 5 // Mock data
    };
  }, [projects, payments]);

  if (!mounted) return null;

  return (
    <div className={cn(commonStyles.dashboardContainer, themeStyles.dashboardContainer)}>
      {/* Header Section */}
      <div className={commonStyles.headerSection}>
        <div className={cn(commonStyles.welcomeText, themeStyles.welcomeText)}>
          <h1>Good morning, Client</h1>
          <p>Here''s what''s happening with your projects today.</p>
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
          themeStyles={themeStyles} 
        />
        <StatCard 
          title="Active Projects" 
          value={metrics.activeProjects.toString()} 
          trend={-2.4} 
          icon={Briefcase} 
          themeStyles={themeStyles} 
        />
        <StatCard 
          title="Pending Proposals" 
          value={metrics.pendingProposals.toString()} 
          trend={5.0} 
          icon={Clock} 
          themeStyles={themeStyles} 
        />
        <StatCard 
          title="Unread Messages" 
          value={metrics.unreadMessages.toString()} 
          icon={MessageSquare} 
          themeStyles={themeStyles} 
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
              <div className="p-4 text-center text-gray-500">Loading projects...</div>
            ) : projects && projects.length > 0 ? (
              projects.slice(0, 3).map((project: any) => (
                <ProjectCard key={project.id} project={project} themeStyles={themeStyles} />
              ))
            ) : (
              <div className="p-8 text-center border border-dashed rounded-lg border-gray-300 dark:border-gray-700">
                <p className="text-gray-500 mb-4">No active projects found.</p>
                <Link href="/client/post-job">
                  <Button variant="outline" size="sm">Post your first job</Button>
                </Link>
              </div>
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
              themeStyles={themeStyles} 
            />
            <TalentCard 
              name="Michael Chen" 
              role="Full Stack Developer" 
              avatar="/avatars/michael.jpg" 
              themeStyles={themeStyles} 
            />
            <TalentCard 
              name="Emma Davis" 
              role="Content Strategist" 
              avatar="/avatars/emma.jpg" 
              themeStyles={themeStyles} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
