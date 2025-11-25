// @AI-HINT: Admin Dashboard page. Theme-aware, accessible, animated KPIs, charts, users table, and quick actions.
'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import { useAdminData, type RecentActivity as ActivityType } from '@/hooks/useAdmin';
import common from './AdminDashboard.common.module.css';
import light from './AdminDashboard.light.module.css';
import dark from './AdminDashboard.dark.module.css';
import UserSearchTable from '@/app/components/Admin/UserSearchTable/UserSearchTable';
import ReviewSentimentDashboard from '@/app/components/Admin/ReviewSentimentDashboard/ReviewSentimentDashboard';
import JobModerationQueue from '@/app/components/Admin/JobModerationQueue/JobModerationQueue';
import FlaggedReviews from '@/app/components/Admin/FlaggedReviews/FlaggedReviews';
import FlaggedFraudList from '@/app/components/Admin/FlaggedFraudList/FlaggedFraudList';
import FraudAlertBanner from '@/app/components/AI/FraudAlertBanner/FraudAlertBanner';
import Button from '@/app/components/Button/Button';
import Card from '@/app/components/Card/Card';
import { 
  Users, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Bell,
  Calendar,
  MessageCircle,
  Eye,
  Plus,
  Shield,
  AlertTriangle,
  BarChart3,
  UserPlus,
  FileText,
  CreditCard,
  Loader2
} from 'lucide-react';

interface KPI { id: string; label: string; value: string; trend: string; }
interface UserRow { id: string; name: string; email: string; role: 'Admin' | 'Client' | 'Freelancer'; status: 'Active' | 'Suspended'; joined: string; }

// Icon mapping for activity types from API
const activityIcons: Record<string, React.ElementType> = {
  user_joined: UserPlus,
  project_posted: FileText,
  proposal_submitted: Briefcase,
  payment_made: CreditCard,
  default: Bell,
};

// Format relative time from ISO timestamp
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

const AdminDashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  const { users, kpis, systemStats, recentActivity, loading, error } = useAdminData();
  const [role, setRole] = useState<'All' | 'Admin' | 'Client' | 'Freelancer'>('All');

  const headerRef = useRef<HTMLDivElement | null>(null);
  const kpiRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const kpisVisible = useIntersectionObserver(kpiRef, { threshold: 0.1 });
  const gridVisible = useIntersectionObserver(gridRef, { threshold: 0.1 });

  const effectiveKPIs: KPI[] = useMemo(() => {
    if (!kpis || !Array.isArray(kpis) || kpis.length === 0) return [];
    return kpis.map((k, idx) => ({ id: String(k.id ?? idx), label: k.label, value: k.value, trend: (k as KPI).trend ?? '' }));
  }, [kpis]);

  const effectiveUsers: UserRow[] = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    return users as UserRow[];
  }, [users]);

  const filteredUsers = useMemo(() => {
    return role === 'All' ? effectiveUsers : effectiveUsers.filter(u => u.role === role);
  }, [effectiveUsers, role]);

  // Transform API recent activity into display format
  const displayActivity = useMemo(() => {
    if (!recentActivity || !Array.isArray(recentActivity) || recentActivity.length === 0) return [];
    return recentActivity.slice(0, 8).map((activity: ActivityType, idx: number) => ({
      id: String(idx),
      title: activity.user_name,
      description: activity.description,
      time: formatRelativeTime(activity.timestamp),
      icon: activityIcons[activity.type] || activityIcons.default,
      amount: activity.amount,
    }));
  }, [recentActivity]);

  // Generate stats from systemStats API response
  const statsData = useMemo(() => {
    if (!systemStats) return [];
    return [
      { title: 'Total Users', value: systemStats.total_users?.toLocaleString() ?? '0', icon: Users, trend: `${systemStats.total_clients} clients`, positive: true },
      { title: 'Active Projects', value: systemStats.active_projects?.toLocaleString() ?? '0', icon: Briefcase, trend: `${systemStats.total_projects} total`, positive: true },
      { title: 'Revenue', value: `$${((systemStats.total_revenue ?? 0) / 1000).toFixed(0)}k`, icon: DollarSign, trend: `${systemStats.total_contracts} contracts`, positive: true },
      { title: 'Pending', value: systemStats.pending_proposals?.toLocaleString() ?? '0', icon: Shield, trend: 'proposals', positive: false },
    ];
  }, [systemStats]);

  if (!resolvedTheme) return null;

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <FraudAlertBanner message="Multiple high-risk activities have been detected. Please review the flagged items immediately."/>
      
      {/* Welcome Banner */}
      <div className={common.welcomeBanner}>
        <div className={common.welcomeBannerContent}>
          <h1 className={common.welcomeBannerTitle}>Welcome back, Admin!</h1>
          <p className={common.welcomeBannerText}>Here&apos;s what&apos;s happening with the platform today.</p>
          <div className={common.quickActions}>
            <Link href="/admin/users">
              <Button variant="secondary" size="md" iconBefore={<Plus size={18} />}>
                Manage Users
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="secondary" size="md" iconBefore={<Shield size={18} />}>
                System Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className={common.container}>
        <div ref={headerRef} className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}>
          <div>
            <h1 className={common.title}>Admin Dashboard</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Global overview of platform metrics, users, and operations.</p>
          </div>
          <div className={common.controls} aria-label="Admin dashboard controls">
            <label className={common.srOnly} htmlFor="role-filter">Filter by role</label>
            <select id="role-filter" className={cn(common.select, themed.select)} value={role} onChange={(e) => setRole(e.target.value as 'All' | 'Admin' | 'Client' | 'Freelancer')} title="Filter users by role">
              {['All','Admin','Client','Freelancer'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <Button variant="primary" size="md">
              Create Announcement
            </Button>
            <Button variant="secondary" size="md">
              Run Maintenance
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className={common.statsGrid}>
            {[1,2,3,4].map(i => (
              <Card key={i} className={common.statCard}>
                <div className={common.loadingState}>
                  <Loader2 className={common.spinner} size={24} />
                  <span>Loading stats...</span>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className={common.errorState}>
            <AlertTriangle size={32} />
            <p>Failed to load dashboard data: {error}</p>
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : statsData.length === 0 ? (
          <div className={common.emptyState}>
            <BarChart3 size={48} />
            <p>No dashboard statistics available yet.</p>
          </div>
        ) : (
          <div className={common.statsGrid}>
            {statsData.map((stat, index) => (
              <Card key={index} className={common.statCard}>
                <div className={common.statHeader}>
                  <div className={common.statIcon}>
                    <stat.icon size={20} />
                  </div>
                  <h3 className={common.statTitle}>{stat.title}</h3>
                </div>
                <div className={common.statValue}>{stat.value}</div>
                <div className={cn(common.statTrend, stat.positive ? common.positive : common.negative)}>
                  {stat.positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>{stat.trend}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        <section ref={kpiRef} className={cn(common.kpis, kpisVisible ? common.isVisible : common.isNotVisible)} aria-labelledby="kpi-section-title">
          <h2 id="kpi-section-title" className={common.srOnly}>Key Performance Indicators</h2>
          {loading && (
            <div className={common.skeletonRow} aria-busy="true" />
          )}
          {!loading && effectiveKPIs.length === 0 && !error && (
            <div className={cn(common.card, themed.card)}>
              <p className={common.emptyText}>No KPI data available. Connect to the admin API.</p>
            </div>
          )}
          {!loading && effectiveKPIs.map(k => (
            <div key={k.id} className={cn(common.card, themed.card)} tabIndex={0} aria-labelledby={`kpi-${k.id}-label`}>
              <div id={`kpi-${k.id}-label`} className={cn(common.cardTitle, themed.cardTitle)}>
                <BarChart3 size={20} />
                {k.label}
              </div>
              <div className={common.metric}>{k.value}</div>
              {k.trend && (
                <div className={cn(common.trend, k.trend.includes('+') ? common.positive : common.negative)}>
                  {k.trend.includes('+') ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {k.trend}
                </div>
              )}
            </div>
          ))}
        </section>

        <div aria-live="polite" className={common.srOnly}>
          {role !== 'All' && `Showing ${filteredUsers.length} ${role} users.`}
        </div>
        
        <section ref={gridRef} className={cn(common.grid, gridVisible ? common.isVisible : common.isNotVisible)} aria-labelledby="main-content-title">
          <h2 id="main-content-title" className={common.srOnly}>Main Content</h2>
          
          {/* Recent Activity */}
          <div className={common.gridSpanFull}>
            <Card title="Recent Activity" icon={Calendar}>
              <div className={common.activityList}>
                {loading ? (
                  <div className={common.loadingState}>
                    <Loader2 className={common.spinner} size={24} />
                    <span>Loading activity...</span>
                  </div>
                ) : displayActivity.length === 0 ? (
                  <div className={common.emptyState}>
                    <Bell size={32} />
                    <p>No recent activity to display.</p>
                  </div>
                ) : (
                  displayActivity.map(activity => (
                    <div key={activity.id} className={common.activityItem}>
                      <div className={common.activityIcon}>
                        <activity.icon size={20} />
                      </div>
                      <div className={common.activityContent}>
                        <h4 className={common.activityTitle}>{activity.title}</h4>
                        <p className={common.activityDescription}>
                          {activity.description}
                          {activity.amount ? ` - $${activity.amount.toLocaleString()}` : ''}
                        </p>
                        <div className={common.activityTime}>{activity.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
          
          <UserSearchTable />
          <ReviewSentimentDashboard />
          <JobModerationQueue />
          <FlaggedReviews />
          <FlaggedFraudList />

          <div className={cn(common.card, themed.card)} aria-labelledby="activity-chart-title">
            <div id="activity-chart-title" className={cn(common.cardTitle, themed.cardTitle)}>
              <BarChart3 size={20} />
              Activity
            </div>
            {/* SVG bar chart to avoid inline styles */}
            <svg width="100%" height="140" viewBox="0 0 200 140" preserveAspectRatio="none" role="img" aria-label="Weekly activity bars">
              <desc>Bar chart of weekly activity counts</desc>
              {/* background */}
              <rect x="0" y="0" width="200" height="140" fill="transparent" />
              {/* bars */}
              {([40, 68, 55, 90, 120, 70, 95] as const).map((h, i) => (
                <rect key={i} x={10 + i * 28} y={130 - h} width="18" height={h} rx="3" ry="3" className={cn(common.cardTitle)} fill="currentColor" opacity="0.8" />
              ))}
            </svg>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminDashboard;