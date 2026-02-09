// @AI-HINT: Redesigned Admin Dashboard with modern UI/UX, quick actions, colour-coded stats, and improved layout
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useAdminData } from '@/hooks/useAdmin';
import Button from '@/app/components/Button/Button';
import {
  Users,
  DollarSign,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  UserPlus,
  FileText,
  CreditCard,
  Bell,
  ShieldAlert,
  Settings,
  Briefcase,
  BarChart3,
} from 'lucide-react';

import commonStyles from './AdminDashboard.common.module.css';
import lightStyles from './AdminDashboard.light.module.css';
import darkStyles from './AdminDashboard.dark.module.css';

// Import existing components to reuse logic
import UserSearchTable from '@/app/components/Admin/UserSearchTable/UserSearchTable';
import FlaggedFraudList from '@/app/components/Admin/FlaggedFraudList/FlaggedFraudList';

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  icon: React.ElementType;
  accent: 'blue' | 'green' | 'amber' | 'red';
  themeStyles: Record<string, string>;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, icon: Icon, accent, themeStyles }) => {
  const isPositive = trend?.includes('+');
  const isNegative = trend?.includes('-');

  return (
    <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
      <div className={cn(commonStyles.statIconBadge, commonStyles[`accent_${accent}`], themeStyles[`accent_${accent}`])}>
        <Icon size={22} />
      </div>
      <div className={commonStyles.statBody}>
        <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>{title}</span>
        <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{value}</span>
        {trend && (
          <span className={cn(
            commonStyles.statTrend,
            isPositive && commonStyles.trendPositive,
            isNegative && commonStyles.trendNegative,
          )}>
            {isPositive ? <TrendingUp size={14} /> : isNegative ? <TrendingDown size={14} /> : null}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

interface QuickActionProps {
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
  themeStyles: Record<string, string>;
}

const QuickAction: React.FC<QuickActionProps> = ({ label, href, icon: Icon, description, themeStyles }) => (
  <Link href={href} className={cn(commonStyles.quickAction, themeStyles.quickAction)}>
    <div className={cn(commonStyles.quickActionIcon, themeStyles.quickActionIcon)}>
      <Icon size={20} />
    </div>
    <div className={commonStyles.quickActionText}>
      <span className={cn(commonStyles.quickActionLabel, themeStyles.quickActionLabel)}>{label}</span>
      <span className={cn(commonStyles.quickActionDesc, themeStyles.quickActionDesc)}>{description}</span>
    </div>
    <ArrowRight size={16} className={commonStyles.quickActionArrow} />
  </Link>
);

const activityIcons: Record<string, React.ElementType> = {
  user_joined: UserPlus,
  project_posted: FileText,
  proposal_submitted: FileText,
  payment_made: CreditCard,
  default: Bell,
};

/* ------------------------------------------------------------------ */
/*  Main dashboard                                                     */
/* ------------------------------------------------------------------ */

const AdminDashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { kpis, recentActivity, loading } = useAdminData();

  useEffect(() => { setMounted(true); }, []);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  // Map KPIs to stat card definitions with accent colours
  const accentMap: Record<string, 'blue' | 'green' | 'amber' | 'red'> = {
    Users: 'blue',
    Revenue: 'green',
    Projects: 'amber',
    Proposals: 'red',
    Disputes: 'red',
  };

  const iconForLabel = (label: string): React.ElementType => {
    if (label.includes('Users')) return Users;
    if (label.includes('Revenue')) return DollarSign;
    if (label.includes('Projects')) return Briefcase;
    if (label.includes('Proposals')) return FileText;
    if (label.includes('Disputes')) return AlertTriangle;
    return Activity;
  };

  const accentForLabel = (label: string): 'blue' | 'green' | 'amber' | 'red' => {
    const key = Object.keys(accentMap).find(k => label.includes(k));
    return key ? accentMap[key] : 'blue';
  };

  const stats = useMemo(() => {
    if (!kpis || kpis.length === 0) return [
      { title: 'Total Users', value: '—', trend: undefined, icon: Users, accent: 'blue' as const },
      { title: 'Revenue', value: '—', trend: undefined, icon: DollarSign, accent: 'green' as const },
      { title: 'Active Projects', value: '—', trend: undefined, icon: Briefcase, accent: 'amber' as const },
      { title: 'System Health', value: '99.9%', trend: undefined, icon: Activity, accent: 'blue' as const },
    ];
    return kpis.map((k: any) => ({
      title: k.label,
      value: k.value,
      trend: k.trend,
      icon: iconForLabel(k.label),
      accent: accentForLabel(k.label),
    }));
  }, [kpis]);

  const quickActions: Omit<QuickActionProps, 'themeStyles'>[] = [
    { label: 'Manage Users', href: '/admin/users', icon: Users, description: 'View, suspend, or verify accounts' },
    { label: 'View Disputes', href: '/admin/disputes', icon: AlertTriangle, description: 'Review open escalations' },
    { label: 'Fraud Detection', href: '/admin/fraud-detection', icon: ShieldAlert, description: 'Flagged transactions & alerts' },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, description: 'Platform insights & reports' },
    { label: 'Payments', href: '/admin/payments', icon: CreditCard, description: 'Transactions, refunds & billing' },
    { label: 'Settings', href: '/admin/settings', icon: Settings, description: 'Platform configuration' },
  ];

  if (!mounted) return null;

  return (
    <div className={cn(commonStyles.dashboardContainer, themeStyles.dashboardContainer)}>
      {/* Header Section */}
      <div className={commonStyles.headerSection}>
        <div className={commonStyles.welcomeText}>
          <h1 className={cn(commonStyles.headerTitle, themeStyles.headerTitle)}>Admin Dashboard</h1>
          <p className={cn(commonStyles.headerSubtitle, themeStyles.headerSubtitle)}>
            Monitor platform performance, manage users, and keep things running smoothly.
          </p>
        </div>
        <div className={commonStyles.headerActions}>
          <Button variant="outline" size="sm">Export Report</Button>
          <Button variant="primary" size="sm">System Settings</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={commonStyles.statsGrid}>
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            title={stat.title}
            value={stat.value}
            trend={stat.trend}
            icon={stat.icon}
            accent={stat.accent}
            themeStyles={themeStyles}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Quick Actions</h2>
        <div className={commonStyles.quickActionsGrid}>
          {quickActions.map((action) => (
            <QuickAction key={action.href} {...action} themeStyles={themeStyles} />
          ))}
        </div>
      </section>

      {/* Main Content Grid */}
      <div className={commonStyles.mainContentGrid}>
        {/* Left Column — User Management */}
        <div className={commonStyles.sectionContainer}>
          <div className={commonStyles.sectionHeader}>
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>User Management</h2>
            <Link href="/admin/users" className={cn(commonStyles.viewAllLink, themeStyles.viewAllLink)}>
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className={cn(commonStyles.tableWrapper, themeStyles.tableWrapper)}>
            <UserSearchTable />
          </div>
        </div>

        {/* Right Column — Activity & Flagged */}
        <div className={commonStyles.sectionContainer}>
          <div className={commonStyles.sectionHeader}>
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Recent Activity</h2>
            <Link href="/admin/audit" className={cn(commonStyles.viewAllLink, themeStyles.viewAllLink)}>
              Audit Log
            </Link>
          </div>

          <div className={commonStyles.activityList}>
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((activity: any, idx: number) => {
                const Icon = activityIcons[activity.type] || activityIcons.default;
                return (
                  <div key={idx} className={cn(commonStyles.activityItem, themeStyles.activityItem)}>
                    <div className={cn(commonStyles.activityIcon, themeStyles.activityIcon)}>
                      <Icon size={16} />
                    </div>
                    <div className={commonStyles.activityContent}>
                      <h4 className={cn(commonStyles.activityName, themeStyles.activityName)}>{activity.user_name}</h4>
                      <p className={cn(commonStyles.activityDesc, themeStyles.activityDesc)}>{activity.description}</p>
                      <span className={commonStyles.activityTime}>
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                <Activity size={32} />
                <p>No recent activity</p>
              </div>
            )}
          </div>

          <div className={commonStyles.flaggedSection}>
            <div className={commonStyles.sectionHeader}>
              <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Flagged Content</h2>
            </div>
            <FlaggedFraudList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
