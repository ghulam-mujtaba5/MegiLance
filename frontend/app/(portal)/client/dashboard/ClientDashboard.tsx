// @AI-HINT: Client Dashboard component. Theme-aware, accessible dashboard with KPIs, recent projects, and activity feed. All data comes from backend APIs via useClientData hook.
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useClientData } from '@/hooks/useClient';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer } from '@/app/components/Animations/StaggerContainer';
import KeyMetrics from './components/KeyMetrics/KeyMetrics';
import { 
  Briefcase, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Plus, 
  FileText, 
  DollarSign, 
  Users, 
  AlertCircle,
  Calendar,
  MessageCircle,
  Award
} from 'lucide-react';
import ProjectCard from '@/app/components/ProjectCard/ProjectCard';
import TransactionRow from '@/app/components/TransactionRow/TransactionRow';
import ProjectStatusChart from './components/ProjectStatusChart/ProjectStatusChart';
import SpendingChart from './components/SpendingChart/SpendingChart';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';
import Button from '@/app/components/Button/Button';
import Card from '@/app/components/Card/Card';
import common from './ClientDashboard.common.module.css';
import light from './ClientDashboard.light.module.css';
import dark from './ClientDashboard.dark.module.css';

const Trend: React.FC<{ value: number }> = ({ value }) => {
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  const color = value > 0 ? 'text-green-500' : value < 0 ? 'text-red-500' : 'text-gray-500';
  const sign = value > 0 ? '+' : '';

  return (
    <span className={`flex items-center text-sm ${color}`}>
      <Icon className="mr-1 h-4 w-4" />
      {sign}{value.toFixed(1)}%
    </span>
  );
};

const ClientDashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { projects, payments, loading, error } = useClientData();

  const metricCards = [
    { title: 'Total Projects', icon: Briefcase, trend: <Trend value={5.2} /> },
    { title: 'Active Projects', icon: CheckCircle, trend: <Trend value={-1.8} /> },
    { title: 'Total Spent', icon: DollarSign, trend: <Trend value={12.5} /> },
    { title: 'Pending Payments', icon: Clock, trend: <Trend value={0} /> },
  ];

  const metrics = useMemo(() => {
    const totalProjects = Array.isArray(projects) ? projects.length : 0;
    const activeProjects = Array.isArray(projects) ? projects.filter(p => p.status === 'In Progress').length : 0;
    const totalSpent = Array.isArray(payments) ? payments.reduce((sum, p) => {
      const amount = parseFloat(p.amount?.replace(/[$,]/g, '') || '0');
      return sum + amount;
    }, 0) : 0;
    const pendingPayments = Array.isArray(payments) ? payments.filter(p => p.status === 'Pending').length : 0;

    return {
      totalProjects,
      activeProjects,
      totalSpent: `$${totalSpent.toLocaleString()}`,
      pendingPayments,
    };
  }, [projects, payments]);

  const [liveRegionMessage, setLiveRegionMessage] = useState('Loading dashboard data.');

  useEffect(() => {
    if (loading) {
      setLiveRegionMessage('Loading dashboard data.');
    } else if (error) {
      setLiveRegionMessage('Failed to load dashboard data. Please try again later.');
    } else {
      setLiveRegionMessage(`Dashboard loaded. You have ${metrics.totalProjects} total projects and ${metrics.pendingPayments} pending payments.`);
    }
  }, [loading, error, metrics.totalProjects, metrics.pendingPayments]);

  const recentProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];
    return projects.slice(0, 3).map((p, idx) => ({
      id: String(p.id ?? idx),
      title: p.title ?? 'Untitled Project',
      clientName: p.client ?? 'Unknown Client',
      budget: typeof p.budget === 'number'
        ? p.budget
        : parseFloat(String(p.budget ?? '0').replace(/[$,]/g, '')) || 0,
      postedTime: p.updatedAt ?? p.updated ?? 'Unknown',
      tags: Array.isArray(p.skills) ? p.skills : [],
    }));
  }, [projects]);

  const recentTransactions = useMemo(() => {
    if (!Array.isArray(payments)) return [];
    return payments.slice(0, 3).map((p, idx) => ({
      id: String(p.id ?? idx),
      amount: p.amount ?? '0',
      date: p.date ?? '',
      description: p.description ?? 'Unknown transaction',
    }));
  }, [payments]);

  // Generate dynamic project status data from real projects
  const projectStatusData = useMemo(() => {
    if (!Array.isArray(projects) || projects.length === 0) {
      return [
        { name: 'In Progress', value: 0 },
        { name: 'Completed', value: 0 },
        { name: 'Pending', value: 0 },
        { name: 'Cancelled', value: 0 },
      ];
    }
    
    const statusCounts = projects.reduce((acc: Record<string, number>, project: any) => {
      const status = project.status || 'Pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return [
      { name: 'In Progress', value: statusCounts['In Progress'] || statusCounts['Active'] || 0 },
      { name: 'Completed', value: statusCounts['Completed'] || statusCounts['Done'] || 0 },
      { name: 'Pending', value: statusCounts['Pending'] || statusCounts['Open'] || 0 },
      { name: 'Cancelled', value: statusCounts['Cancelled'] || 0 },
    ];
  }, [projects]);

  // Generate dynamic spending data from payments
  const spendingData = useMemo(() => {
    if (!Array.isArray(payments) || payments.length === 0) {
      // Return last 6 months with zero values
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      return months.map(name => ({ name, spending: 0 }));
    }

    // Group payments by month
    const monthlySpending: Record<string, number> = {};
    payments.forEach((payment: any) => {
      const date = new Date(payment.date || Date.now());
      const monthKey = date.toLocaleString('default', { month: 'short' });
      const amount = parseFloat(String(payment.amount || '0').replace(/[$,+]/g, '')) || 0;
      monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + amount;
    });

    // Get last 6 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      last6Months.push(months[monthIndex]);
    }

    return last6Months.map(name => ({
      name,
      spending: monthlySpending[name] || 0,
    }));
  }, [payments]);

  // Generate dynamic activity from real data
  const recentActivity = useMemo(() => {
    const activities: Array<{
      id: string;
      title: string;
      description: string;
      time: string;
      icon: typeof Briefcase;
      type: 'project' | 'payment' | 'proposal' | 'message';
    }> = [];

    // Add activities from projects
    if (Array.isArray(projects) && projects.length > 0) {
      projects.slice(0, 2).forEach((project: any, index: number) => {
        activities.push({
          id: `project-${project.id || index}`,
          title: project.status === 'Completed' ? 'Project completed' : 'Project update',
          description: project.title || 'Project activity',
          time: project.updatedAt || project.updated || 'Recently',
          icon: Briefcase,
          type: 'project'
        });
      });
    }

    // Add activities from payments
    if (Array.isArray(payments) && payments.length > 0) {
      payments.slice(0, 2).forEach((payment: any, index: number) => {
        activities.push({
          id: `payment-${payment.id || index}`,
          title: payment.status === 'Completed' ? 'Payment completed' : 'Payment pending',
          description: `${payment.amount} - ${payment.description || 'Transaction'}`,
          time: payment.date || 'Recently',
          icon: DollarSign,
          type: 'payment'
        });
      });
    }

    // Add metric-based activities
    if (metrics.activeProjects > 0) {
      activities.push({
        id: 'active-projects',
        title: 'Active projects',
        description: `${metrics.activeProjects} project(s) currently in progress`,
        time: 'Ongoing',
        icon: Clock,
        type: 'project'
      });
    }

    // Fallback if no real data
    if (activities.length === 0) {
      activities.push({
        id: 'welcome',
        title: 'Welcome to MegiLance!',
        description: 'Start by posting your first project to find talented freelancers',
        time: 'Just now',
        icon: Award,
        type: 'message'
      });
    }

    return activities.slice(0, 4);
  }, [projects, payments, metrics.activeProjects]);

  return (
    <PageTransition>
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.srOnly} aria-live="polite" role="status">
          {liveRegionMessage}
        </div>
        <div className={common.container}>
          {/* Welcome Banner */}
          <ScrollReveal>
            <div className={cn(common.welcomeBanner, themed.welcomeBanner)}>
              <div className={common.welcomeBannerContent}>
                <h1 className={cn(common.welcomeBannerTitle, themed.welcomeBannerTitle)}>
                  Welcome back! 👋
                </h1>
                <p className={cn(common.welcomeBannerText, themed.welcomeBannerText)}>
                  Here&apos;s what&apos;s happening with your projects and freelancers today.
                </p>
                <div className={common.quickActions}>
                  <Link href="/client/post-job">
                    <Button variant="primary" size="md" iconBefore={<Plus size={18} />}>
                      Post New Project
                    </Button>
                  </Link>
                  <Link href="/freelancers">
                    <Button variant="secondary" size="md" iconBefore={<Users size={18} />}>
                      Find Freelancers
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {error && (
            <div className={cn(common.errorBanner, themed.errorBanner)}>
              <AlertCircle size={20} />
              <span>Unable to load some data. Please refresh the page.</span>
            </div>
          )}

          <ScrollReveal delay={0.1}>
            <div className={common.widgetsGrid}>
              <KeyMetrics metrics={metrics} loading={loading} metricCards={metricCards} />
            </div>
          </ScrollReveal>

          <StaggerContainer delay={0.2} className={common.dashboardGrid}>
          {/* Charts */}
          <div className={common.chartsContainer}>
            <Card title="Spending Overview" icon={DollarSign}>
              <SpendingChart data={spendingData} />
            </Card>
            <Card title="Project Status" icon={Briefcase}>
              <ProjectStatusChart data={projectStatusData} />
            </Card>
          </div>

          {/* Recent Activity */}
          <div className={common.activitySection}>
            <Card title="Recent Activity" icon={Calendar}>
              <div className={common.activityList}>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={common.activityItemSkeleton}>
                      <div className={common.skeletonIcon} />
                      <div className={common.skeletonContent}>
                        <div className={common.skeletonTitle} />
                        <div className={common.skeletonDesc} />
                      </div>
                    </div>
                  ))
                ) : (
                  recentActivity.map(activity => (
                    <div key={activity.id} className={cn(common.activityItem, themed.activityItem)}>
                      <div className={cn(
                        common.activityIcon, 
                        themed.activityIcon,
                        themed[`activityIcon${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}`]
                      )}>
                        <activity.icon size={18} />
                      </div>
                      <div className={common.activityContent}>
                        <h4 className={cn(common.activityTitle, themed.activityTitle)}>
                          {activity.title}
                        </h4>
                        <p className={cn(common.activityDescription, themed.activityDescription)}>
                          {activity.description}
                        </p>
                        <span className={cn(common.activityTime, themed.activityTime)}>
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Projects Section */}
          <section className={cn(common.section, common.gridSpan2)} aria-labelledby="recent-projects-title">
            <div className={common.sectionHeader}>
              <h2 id="recent-projects-title" className={common.sectionTitle}>
                <Briefcase size={24} />
                Recent Projects
              </h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className={common.projectList}>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={common.cardSkeleton}>
                    <Skeleton height={16} width={'50%'} />
                    <Skeleton height={12} width={'70%'} />
                    <Skeleton height={12} width={120} />
                  </div>
                ))
              ) : (
                <>
                  {recentProjects.map(project => (
                    <ProjectCard
                      key={project.id}
                      id={project.id}
                      title={project.title}
                      status={('In Progress')}
                      progress={0}
                      budget={project.budget}
                      paid={0}
                      freelancers={[]}
                      updatedAt={project.postedTime}
                      clientName={project.clientName}
                      postedTime={project.postedTime}
                      tags={project.tags}
                    />
                  ))}
                  {recentProjects.length === 0 && (
                    <div className={common.emptyState}>No projects found.</div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Transactions Section */}
          <section className={cn(common.section, common.gridSpanFull)} aria-labelledby="recent-transactions-title">
            <div className={common.sectionHeader}>
              <h2 id="recent-transactions-title" className={common.sectionTitle}>
                <DollarSign size={24} />
                Recent Transactions
              </h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className={common.transactionList}>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={common.rowSkeleton}>
                    <Skeleton height={14} width={'30%'} />
                    <Skeleton height={12} width={'20%'} />
                    <Skeleton height={12} width={'40%'} />
                  </div>
                ))
              ) : (
                <>
                  {recentTransactions.map(txn => (
                    <TransactionRow
                      key={txn.id}
                      amount={txn.amount}
                      date={txn.date}
                      description={txn.description}
                    />
                  ))}
                  {recentTransactions.length === 0 && (
                    <div className={common.emptyState}>No transactions found.</div>
                  )}
                </>
              )}
            </div>
          </section>
          </StaggerContainer>
        </div>
      </main>
    </PageTransition>
  );
};

export default ClientDashboard;