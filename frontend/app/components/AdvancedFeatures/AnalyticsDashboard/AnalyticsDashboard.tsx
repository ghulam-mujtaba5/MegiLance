// @AI-HINT: Comprehensive Analytics Dashboard component with multiple chart types and real-time data
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaDollarSign,
  FaUsers,
  FaBriefcase,
  FaTrendingUp,
  FaTrendingDown,
  FaCalendar,
} from 'react-icons/fa';
import commonStyles from './AnalyticsDashboard.common.module.css';
import lightStyles from './AnalyticsDashboard.light.module.css';
import darkStyles from './AnalyticsDashboard.dark.module.css';

export interface AnalyticsData {
  revenue?: {
    current: number;
    previous: number;
    trend: 'up' | 'down';
    chartData: { label: string; value: number }[];
  };
  users?: {
    total: number;
    active: number;
    growth: number;
    chartData: { label: string; value: number }[];
  };
  projects?: {
    total: number;
    active: number;
    completed: number;
    chartData: { label: string; value: number }[];
  };
  performance?: {
    responseTime: number;
    successRate: number;
    satisfaction: number;
  };
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange?: (range: '7d' | '30d' | '90d' | '1y') => void;
  className?: string;
}

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down';
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, change, trend, color }) => {
  const { resolvedTheme } = useTheme();
  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return {
      statCard: cn(commonStyles.statCard, themeStyles.statCard),
      statIcon: cn(commonStyles.statIcon, themeStyles.statIcon),
      statContent: cn(commonStyles.statContent, themeStyles.statContent),
      statTitle: cn(commonStyles.statTitle, themeStyles.statTitle),
      statValue: cn(commonStyles.statValue, themeStyles.statValue),
      statChange: cn(commonStyles.statChange, themeStyles.statChange),
      statTrend: cn(commonStyles.statTrend, themeStyles.statTrend),
    };
  }, [resolvedTheme]);

  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ backgroundColor: color + '20', color }}>
        <Icon />
      </div>
      <div className={styles.statContent}>
        <div className={styles.statTitle}>{title}</div>
        <div className={styles.statValue}>{value}</div>
        {change !== undefined && (
          <div className={styles.statChange}>
            {trend === 'up' ? (
              <FaTrendingUp className={styles.statTrend} style={{ color: '#27AE60' }} />
            ) : (
              <FaTrendingDown className={styles.statTrend} style={{ color: '#e81123' }} />
            )}
            <span style={{ color: trend === 'up' ? '#27AE60' : '#e81123' }}>
              {change > 0 ? '+' : ''}
              {change}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  data,
  timeRange = '30d',
  onTimeRangeChange,
  className,
}) => {
  const { resolvedTheme } = useTheme();

  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return {
      container: cn(commonStyles.container, themeStyles.container),
      header: cn(commonStyles.header, themeStyles.header),
      headerTitle: cn(commonStyles.headerTitle, themeStyles.headerTitle),
      timeRangeSelector: cn(commonStyles.timeRangeSelector, themeStyles.timeRangeSelector),
      timeRangeButton: cn(commonStyles.timeRangeButton, themeStyles.timeRangeButton),
      timeRangeButtonActive: cn(
        commonStyles.timeRangeButtonActive,
        themeStyles.timeRangeButtonActive
      ),
      statsGrid: cn(commonStyles.statsGrid, themeStyles.statsGrid),
      chartsGrid: cn(commonStyles.chartsGrid, themeStyles.chartsGrid),
      chartCard: cn(commonStyles.chartCard, themeStyles.chartCard),
      chartTitle: cn(commonStyles.chartTitle, themeStyles.chartTitle),
      chartPlaceholder: cn(commonStyles.chartPlaceholder, themeStyles.chartPlaceholder),
    };
  }, [resolvedTheme]);

  const timeRanges = [
    { value: '7d' as const, label: 'Last 7 days' },
    { value: '30d' as const, label: 'Last 30 days' },
    { value: '90d' as const, label: 'Last 90 days' },
    { value: '1y' as const, label: 'Last year' },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return (
    <div className={cn(styles.container, className)}>
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>
          <FaChartLine /> Analytics Dashboard
        </h2>
        <div className={styles.timeRangeSelector}>
          {timeRanges.map(({ value, label }) => (
            <button
              key={value}
              className={cn(
                styles.timeRangeButton,
                timeRange === value && styles.timeRangeButtonActive
              )}
              onClick={() => onTimeRangeChange?.(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.statsGrid}>
        {data.revenue && (
          <StatCard
            icon={FaDollarSign}
            title="Total Revenue"
            value={formatCurrency(data.revenue.current)}
            change={calculatePercentageChange(data.revenue.current, data.revenue.previous)}
            trend={data.revenue.trend}
            color="#27AE60"
          />
        )}
        {data.users && (
          <StatCard
            icon={FaUsers}
            title="Total Users"
            value={formatNumber(data.users.total)}
            change={data.users.growth}
            trend={data.users.growth > 0 ? 'up' : 'down'}
            color="#4573df"
          />
        )}
        {data.projects && (
          <StatCard
            icon={FaBriefcase}
            title="Active Projects"
            value={formatNumber(data.projects.active)}
            color="#ff9800"
          />
        )}
        {data.performance && (
          <StatCard
            icon={FaTrendingUp}
            title="Success Rate"
            value={`${data.performance.successRate}%`}
            color="#F2C94C"
          />
        )}
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            <FaChartLine /> Revenue Trend
          </h3>
          <div className={styles.chartPlaceholder}>
            {/* Chart library integration point (Chart.js, Recharts, etc.) */}
            <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
              <FaChartLine style={{ fontSize: '48px', marginBottom: '16px' }} />
              <p>Revenue chart visualization</p>
              <small>Integrate with Chart.js or Recharts</small>
            </div>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            <FaChartBar /> User Growth
          </h3>
          <div className={styles.chartPlaceholder}>
            <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
              <FaChartBar style={{ fontSize: '48px', marginBottom: '16px' }} />
              <p>User growth chart visualization</p>
              <small>Integrate with Chart.js or Recharts</small>
            </div>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            <FaChartPie /> Project Distribution
          </h3>
          <div className={styles.chartPlaceholder}>
            <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
              <FaChartPie style={{ fontSize: '48px', marginBottom: '16px' }} />
              <p>Project distribution pie chart</p>
              <small>Integrate with Chart.js or Recharts</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
