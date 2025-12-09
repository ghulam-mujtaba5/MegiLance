// @AI-HINT: Redesigned Admin Dashboard with modern UI/UX
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
  Bell
} from 'lucide-react';

import commonStyles from './AdminDashboard.common.module.css';
import lightStyles from './AdminDashboard.light.module.css';
import darkStyles from './AdminDashboard.dark.module.css';

// Import existing components to reuse logic
import UserSearchTable from '@/app/components/Admin/UserSearchTable/UserSearchTable';
import FlaggedFraudList from '@/app/components/Admin/FlaggedFraudList/FlaggedFraudList';

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  icon: React.ElementType;
  themeStyles: any;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, icon: Icon, themeStyles }) => {
  const isPositive = trend && trend.includes('+');
  const isNegative = trend && trend.includes('-');
  
  return (
    <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
      <div className={cn(commonStyles.statHeader, themeStyles.statHeader)}>
        <span>{title}</span>
        <Icon size={20} />
      </div>
      <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{value}</div>
      {trend && (
        <div className={cn(commonStyles.statTrend, isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-gray-500')}>
          {isPositive ? <TrendingUp size={16} /> : isNegative ? <TrendingDown size={16} /> : null}
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};

const activityIcons: Record<string, React.ElementType> = {
  user_joined: UserPlus,
  project_posted: FileText,
  proposal_submitted: FileText,
  payment_made: CreditCard,
  default: Bell,
};

const AdminDashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { kpis, recentActivity, loading } = useAdminData();

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const stats = useMemo(() => {
    if (!kpis) return [];
    return kpis.map((k: any) => ({
      title: k.label,
      value: k.value,
      trend: k.trend,
      icon: k.label.includes('Users') ? Users : 
            k.label.includes('Revenue') ? DollarSign : 
            k.label.includes('Disputes') ? AlertTriangle : Activity
    }));
  }, [kpis]);

  if (!mounted) return null;

  return (
    <div className={cn(commonStyles.dashboardContainer, themeStyles.dashboardContainer)}>
      {/* Header Section */}
      <div className={commonStyles.headerSection}>
        <div className={cn(commonStyles.welcomeText, themeStyles.welcomeText)}>
          <h1>System Overview</h1>
          <p>Monitor platform performance and user activity.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline">Export Report</Button>
           <Button variant="primary">System Settings</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={commonStyles.statsGrid}>
        {stats.length > 0 ? stats.map((stat: any, idx: number) => (
          <StatCard 
            key={idx}
            title={stat.title} 
            value={stat.value} 
            trend={stat.trend} 
            icon={stat.icon} 
            themeStyles={themeStyles} 
          />
        )) : (
           // Fallback stats
           <>
             <StatCard title="Total Users" value="1,234" trend="+12%" icon={Users} themeStyles={themeStyles} />
             <StatCard title="Total Revenue" value="$45,678" trend="+8%" icon={DollarSign} themeStyles={themeStyles} />
             <StatCard title="Active Disputes" value="3" trend="-1" icon={AlertTriangle} themeStyles={themeStyles} />
             <StatCard title="System Health" value="99.9%" icon={Activity} themeStyles={themeStyles} />
           </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className={commonStyles.mainContentGrid}>
        {/* Left Column */}
        <div className={commonStyles.sectionContainer}>
          <div className={commonStyles.sectionHeader}>
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>User Management</h2>
            <Link href="/admin/users" className={cn(commonStyles.viewAllLink, themeStyles.viewAllLink)}>
              View All Users <ArrowRight size={16} className="inline ml-1" />
            </Link>
          </div>
          
          {/* Reuse existing UserSearchTable but wrap it or style it if needed */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
             <UserSearchTable />
          </div>
        </div>

        {/* Right Column */}
        <div className={commonStyles.sectionContainer}>
          <div className={commonStyles.sectionHeader}>
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Recent Activity</h2>
            <Link href="/admin/audit" className={cn(commonStyles.viewAllLink, themeStyles.viewAllLink)}>
              View Audit Log
            </Link>
          </div>

          <div className={commonStyles.activityList}>
            {recentActivity && recentActivity.slice(0, 5).map((activity: any, idx: number) => {
              const Icon = activityIcons[activity.type] || activityIcons.default;
              return (
                <div key={idx} className={cn(commonStyles.activityItem, themeStyles.activityItem)}>
                  <div className={cn(commonStyles.activityIcon, themeStyles.activityIcon)}>
                    <Icon size={16} />
                  </div>
                  <div className={cn(commonStyles.activityContent, themeStyles.activityContent)}>
                    <h4>{activity.user_name}</h4>
                    <p>{activity.description}</p>
                    <div className={commonStyles.activityTime}>
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8">
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
