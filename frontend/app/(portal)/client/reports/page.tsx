// @AI-HINT: Client Reports page - analytics and reports for clients
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import Loading from '@/app/components/Loading/Loading';
import { portalApi, analyticsApi } from '@/lib/api';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users,
  Calendar,
  Download,
  FileText,
  PieChart
} from 'lucide-react';

import commonStyles from './Reports.common.module.css';
import lightStyles from './Reports.light.module.css';
import darkStyles from './Reports.dark.module.css';

export default function ClientReportsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [stats, setStats] = useState({
    totalSpent: 0,
    projectsCompleted: 0,
    activeFreelancers: 0,
    avgProjectCost: 0,
  });
  const [spendingData, setSpendingData] = useState<{name: string; spending: number}[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashboardStats, monthlySpending] = await Promise.all([
          portalApi.client.getDashboardStats().catch(() => ({})),
          portalApi.client.getMonthlySpending(6).catch(() => ({ spending: [] })),
        ]);
        
        setStats({
          totalSpent: (dashboardStats as any).total_spent || 0,
          projectsCompleted: (dashboardStats as any).completed_projects || 0,
          activeFreelancers: (dashboardStats as any).active_freelancers || 0,
          avgProjectCost: (dashboardStats as any).avg_project_cost || 0,
        });
        
        setSpendingData(monthlySpending.spending || []);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      fetchData();
    }
  }, [mounted, dateRange]);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  if (!mounted) {
    return <Loading />;
  }

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Reports & Analytics</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Track your spending and project performance
          </p>
        </div>
        <div className={commonStyles.headerActions}>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className={cn(commonStyles.dateSelect, themeStyles.dateSelect)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" iconBefore={<Download size={18} />}>
            Export Report
          </Button>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          {/* Stats Overview */}
          <div className={commonStyles.statsGrid}>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.statIconPrimary)}>
                <DollarSign size={24} />
              </div>
              <div>
                <span className={commonStyles.statLabel}>Total Spent</span>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
                  ${stats.totalSpent.toLocaleString()}
                </span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.statIconSuccess)}>
                <FileText size={24} />
              </div>
              <div>
                <span className={commonStyles.statLabel}>Projects Completed</span>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
                  {stats.projectsCompleted}
                </span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.statIconInfo)}>
                <Users size={24} />
              </div>
              <div>
                <span className={commonStyles.statLabel}>Active Freelancers</span>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
                  {stats.activeFreelancers}
                </span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.statIconWarning)}>
                <TrendingUp size={24} />
              </div>
              <div>
                <span className={commonStyles.statLabel}>Avg Project Cost</span>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
                  ${stats.avgProjectCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className={commonStyles.chartsGrid}>
            <div className={cn(commonStyles.chartCard, themeStyles.chartCard)}>
              <h3 className={cn(commonStyles.chartTitle, themeStyles.chartTitle)}>
                <BarChart3 size={20} />
                Monthly Spending
              </h3>
              <div className={commonStyles.chartPlaceholder}>
                {spendingData.length > 0 ? (
                  <div className={commonStyles.barChart}>
                    {spendingData.map((item, index) => (
                      <div key={index} className={commonStyles.barItem}>
                        <div 
                          className={cn(commonStyles.bar, themeStyles.bar)}
                          style={{ 
                            height: `${Math.max(10, (item.spending / Math.max(...spendingData.map(d => d.spending))) * 100)}%` 
                          }}
                        />
                        <span className={commonStyles.barLabel}>{item.name}</span>
                        <span className={commonStyles.barValue}>${item.spending}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={commonStyles.noData}>No spending data available</p>
                )}
              </div>
            </div>

            <div className={cn(commonStyles.chartCard, themeStyles.chartCard)}>
              <h3 className={cn(commonStyles.chartTitle, themeStyles.chartTitle)}>
                <PieChart size={20} />
                Spending by Category
              </h3>
              <div className={commonStyles.chartPlaceholder}>
                <p className={commonStyles.noData}>Category breakdown coming soon</p>
              </div>
            </div>
          </div>

          {/* Quick Reports */}
          <div className={cn(commonStyles.reportsSection, themeStyles.reportsSection)}>
            <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
              Available Reports
            </h3>
            <div className={commonStyles.reportsList}>
              {[
                { name: 'Payment History', icon: DollarSign, description: 'All payments made to freelancers' },
                { name: 'Project Summary', icon: FileText, description: 'Overview of all your projects' },
                { name: 'Time Tracking', icon: Calendar, description: 'Hours logged by freelancers' },
                { name: 'Tax Report', icon: BarChart3, description: 'Annual spending for tax purposes' },
              ].map((report, index) => (
                <div key={index} className={cn(commonStyles.reportCard, themeStyles.reportCard)}>
                  <div className={commonStyles.reportIcon}>
                    <report.icon size={24} />
                  </div>
                  <div className={commonStyles.reportInfo}>
                    <h4>{report.name}</h4>
                    <p>{report.description}</p>
                  </div>
                  <Button variant="outline" size="sm" iconBefore={<Download size={16} />}>
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
