// @AI-HINT: Client Dashboard component. Theme-aware, accessible dashboard with KPIs, recent projects, and activity feed.
'use client';

import React, { useMemo, useRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import { useClientData } from '@/hooks/useClient';
import DashboardWidget from '@/app/components/DashboardWidget/DashboardWidget';
import ProjectCard from '@/app/components/ProjectCard/ProjectCard';
import TransactionRow from '@/app/components/TransactionRow/TransactionRow';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';
import common from './ClientDashboard.common.module.css';
import light from './ClientDashboard.light.module.css';
import dark from './ClientDashboard.dark.module.css';

const ClientDashboard: React.FC = () => {
  const { theme } = useTheme();
  const themed = theme === 'dark' ? dark : light;
  const { projects, payments, loading, error } = useClientData();

  const headerRef = useRef<HTMLDivElement | null>(null);
  const widgetsRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const widgetsVisible = useIntersectionObserver(widgetsRef, { threshold: 0.1 });
  const contentVisible = useIntersectionObserver(contentRef, { threshold: 0.1 });

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

  const recentProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];
    return projects.slice(0, 3).map((p, idx) => ({
      id: String(p.id ?? idx),
      title: p.title ?? 'Untitled Project',
      clientName: p.client ?? 'Unknown Client',
      budget: p.budget ?? '$0',
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

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <div ref={headerRef} className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}>
          <div>
            <h1 className={common.title}>Client Dashboard</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Manage your projects, track spending, and monitor freelancer performance.</p>
          </div>
        </div>

        {loading && <div className={common.loading} aria-busy={loading || undefined}>Loading dashboard...</div>}
        {error && <div className={common.error}>Failed to load dashboard data.</div>}

        <div
          ref={widgetsRef}
          className={cn(common.widgetsGrid, widgetsVisible ? common.isVisible : common.isNotVisible)}
          aria-busy={loading || undefined}
        >
          {loading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={common.widgetSkeleton}>
                  <Skeleton height={18} width={120} />
                  <Skeleton height={28} width={90} />
                </div>
              ))}
            </>
          ) : (
            <>
              <DashboardWidget title="Total Projects" value={String(metrics.totalProjects)} />
              <DashboardWidget title="Active Projects" value={String(metrics.activeProjects)} />
              <DashboardWidget title="Total Spent" value={metrics.totalSpent} />
              <DashboardWidget title="Pending Payments" value={String(metrics.pendingPayments)} />
            </>
          )}
        </div>

        <div ref={contentRef} className={cn(common.mainContent, contentVisible ? common.isVisible : common.isNotVisible)}>
          <section className={common.section} aria-busy={loading || undefined}>
            <h2 className={common.sectionTitle}>Recent Projects</h2>
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
                      title={project.title}
                      clientName={project.clientName}
                      budget={project.budget}
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

          <section className={common.section} aria-busy={loading || undefined}>
            <h2 className={common.sectionTitle}>Recent Transactions</h2>
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
        </div>
      </div>
    </main>
  );
};

export default ClientDashboard; 