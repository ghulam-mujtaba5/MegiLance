// @AI-HINT: Admin metrics dashboard with real-time KPIs, charts, and platform health monitoring
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '../../../components/Button/Button';
import commonStyles from './Metrics.common.module.css';
import lightStyles from './Metrics.light.module.css';
import darkStyles from './Metrics.dark.module.css';

interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  period: string;
}

interface ChartData {
  label: string;
  value: number;
}

interface SystemHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  uptime: number;
  lastChecked: string;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  user?: string;
  timestamp: string;
}

type TimeRange = '24h' | '7d' | '30d' | '90d' | 'custom';

export default function MetricsDashboardPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<ChartData[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    setMounted(true);
    loadMetricsData();
  }, [timeRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadMetricsData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, timeRange]);

  const loadMetricsData = async () => {
    setLoading(true);
    try {
      // Simulated API calls - replace with actual API integration
      // const [metricsRes, healthRes, activityRes] = await Promise.all([
      //   metricsDashboardApi.getMetrics({ timeRange }),
      //   metricsDashboardApi.getSystemHealth(),
      //   metricsDashboardApi.getRecentActivity()
      // ]);

      // Mock data
      setMetrics([
        {
          id: '1',
          title: 'Total Revenue',
          value: '$124,532',
          change: 12.5,
          changeType: 'increase',
          icon: '💰',
          period: 'vs last period'
        },
        {
          id: '2',
          title: 'Active Users',
          value: '8,432',
          change: 8.3,
          changeType: 'increase',
          icon: '👥',
          period: 'vs last period'
        },
        {
          id: '3',
          title: 'New Projects',
          value: '342',
          change: -2.1,
          changeType: 'decrease',
          icon: '📁',
          period: 'vs last period'
        },
        {
          id: '4',
          title: 'Completion Rate',
          value: '94.2%',
          change: 1.8,
          changeType: 'increase',
          icon: '✅',
          period: 'vs last period'
        },
        {
          id: '5',
          title: 'Avg. Response Time',
          value: '2.4h',
          change: -15.3,
          changeType: 'increase',
          icon: '⏱️',
          period: 'faster'
        },
        {
          id: '6',
          title: 'Platform Fee',
          value: '$12,453',
          change: 10.2,
          changeType: 'increase',
          icon: '📊',
          period: 'vs last period'
        }
      ]);

      setRevenueData([
        { label: 'Mon', value: 12500 },
        { label: 'Tue', value: 15200 },
        { label: 'Wed', value: 18300 },
        { label: 'Thu', value: 16800 },
        { label: 'Fri', value: 21500 },
        { label: 'Sat', value: 19200 },
        { label: 'Sun', value: 17800 }
      ]);

      setUserGrowthData([
        { label: 'Week 1', value: 7200 },
        { label: 'Week 2', value: 7450 },
        { label: 'Week 3', value: 7800 },
        { label: 'Week 4', value: 8432 }
      ]);

      setSystemHealth([
        { service: 'API Server', status: 'healthy', latency: 45, uptime: 99.98, lastChecked: new Date().toISOString() },
        { service: 'Database', status: 'healthy', latency: 12, uptime: 99.99, lastChecked: new Date().toISOString() },
        { service: 'File Storage', status: 'healthy', latency: 78, uptime: 99.95, lastChecked: new Date().toISOString() },
        { service: 'Email Service', status: 'degraded', latency: 250, uptime: 98.5, lastChecked: new Date().toISOString() },
        { service: 'Payment Gateway', status: 'healthy', latency: 120, uptime: 99.97, lastChecked: new Date().toISOString() }
      ]);

      setRecentActivity([
        { id: '1', type: 'user_signup', description: 'New user registered', user: 'john@example.com', timestamp: new Date().toISOString() },
        { id: '2', type: 'project_created', description: 'New project posted', user: 'client@company.com', timestamp: new Date(Date.now() - 600000).toISOString() },
        { id: '3', type: 'payment', description: 'Payment processed: $1,500', timestamp: new Date(Date.now() - 1200000).toISOString() },
        { id: '4', type: 'contract_completed', description: 'Contract marked complete', timestamp: new Date(Date.now() - 1800000).toISOString() },
        { id: '5', type: 'dispute_opened', description: 'New dispute opened', timestamp: new Date(Date.now() - 3600000).toISOString() }
      ]);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxValue = (data: ChartData[]) => Math.max(...data.map(d => d.value));

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={cn(commonStyles.header, themeStyles.header)}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>
            Metrics Dashboard
          </h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Real-time platform metrics and system health monitoring
          </p>
        </div>
        <div className={commonStyles.headerActions}>
          <label className={cn(commonStyles.autoRefresh, themeStyles.autoRefresh)}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <Button variant="secondary" onClick={loadMetricsData}>
            Refresh Now
          </Button>
          <Button variant="primary">Export Report</Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className={cn(commonStyles.timeRangeSelector, themeStyles.timeRangeSelector)}>
        {(['24h', '7d', '30d', '90d'] as TimeRange[]).map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={cn(
              commonStyles.rangeBtn,
              themeStyles.rangeBtn,
              timeRange === range && commonStyles.rangeBtnActive,
              timeRange === range && themeStyles.rangeBtnActive
            )}
          >
            {range}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={commonStyles.loading}>Loading metrics...</div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className={commonStyles.metricsGrid}>
            {metrics.map(metric => (
              <div
                key={metric.id}
                className={cn(commonStyles.metricCard, themeStyles.metricCard)}
              >
                <div className={commonStyles.metricHeader}>
                  <span className={commonStyles.metricIcon}>{metric.icon}</span>
                  <span className={cn(commonStyles.metricTitle, themeStyles.metricTitle)}>
                    {metric.title}
                  </span>
                </div>
                <div className={cn(commonStyles.metricValue, themeStyles.metricValue)}>
                  {metric.value}
                </div>
                <div className={commonStyles.metricChange}>
                  <span className={cn(
                    commonStyles.changeIndicator,
                    metric.changeType === 'increase' && commonStyles.changeUp,
                    metric.changeType === 'increase' && themeStyles.changeUp,
                    metric.changeType === 'decrease' && commonStyles.changeDown,
                    metric.changeType === 'decrease' && themeStyles.changeDown
                  )}>
                    {metric.changeType === 'increase' ? '↑' : metric.changeType === 'decrease' ? '↓' : '→'}
                    {Math.abs(metric.change)}%
                  </span>
                  <span className={cn(commonStyles.changePeriod, themeStyles.changePeriod)}>
                    {metric.period}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className={commonStyles.chartsGrid}>
            {/* Revenue Chart */}
            <div className={cn(commonStyles.chartCard, themeStyles.chartCard)}>
              <h3 className={cn(commonStyles.chartTitle, themeStyles.chartTitle)}>
                Revenue Trend
              </h3>
              <div className={commonStyles.barChart}>
                {revenueData.map((item, index) => (
                  <div key={index} className={commonStyles.barColumn}>
                    <div
                      className={cn(commonStyles.bar, themeStyles.bar)}
                      style={{ height: `${(item.value / getMaxValue(revenueData)) * 100}%` }}
                    >
                      <span className={cn(commonStyles.barValue, themeStyles.barValue)}>
                        ${(item.value / 1000).toFixed(1)}k
                      </span>
                    </div>
                    <span className={cn(commonStyles.barLabel, themeStyles.barLabel)}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* User Growth Chart */}
            <div className={cn(commonStyles.chartCard, themeStyles.chartCard)}>
              <h3 className={cn(commonStyles.chartTitle, themeStyles.chartTitle)}>
                User Growth
              </h3>
              <div className={commonStyles.lineChart}>
                {userGrowthData.map((item, index) => (
                  <div key={index} className={commonStyles.linePoint}>
                    <div
                      className={cn(commonStyles.point, themeStyles.point)}
                      style={{ bottom: `${(item.value / getMaxValue(userGrowthData)) * 80}%` }}
                    />
                    <span className={cn(commonStyles.pointLabel, themeStyles.pointLabel)}>
                      {item.label}
                    </span>
                    <span className={cn(commonStyles.pointValue, themeStyles.pointValue)}>
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Health & Activity */}
          <div className={commonStyles.bottomGrid}>
            {/* System Health */}
            <div className={cn(commonStyles.healthCard, themeStyles.healthCard)}>
              <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>
                System Health
              </h3>
              <div className={commonStyles.healthList}>
                {systemHealth.map((item, index) => (
                  <div key={index} className={cn(commonStyles.healthItem, themeStyles.healthItem)}>
                    <div className={commonStyles.healthInfo}>
                      <span className={cn(
                        commonStyles.statusDot,
                        item.status === 'healthy' && commonStyles.statusHealthy,
                        item.status === 'healthy' && themeStyles.statusHealthy,
                        item.status === 'degraded' && commonStyles.statusDegraded,
                        item.status === 'degraded' && themeStyles.statusDegraded,
                        item.status === 'down' && commonStyles.statusDown,
                        item.status === 'down' && themeStyles.statusDown
                      )} />
                      <span className={cn(commonStyles.serviceName, themeStyles.serviceName)}>
                        {item.service}
                      </span>
                    </div>
                    <div className={commonStyles.healthMetrics}>
                      <span className={cn(commonStyles.latency, themeStyles.latency)}>
                        {item.latency}ms
                      </span>
                      <span className={cn(commonStyles.uptime, themeStyles.uptime)}>
                        {item.uptime}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className={cn(commonStyles.activityCard, themeStyles.activityCard)}>
              <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>
                Recent Activity
              </h3>
              <div className={commonStyles.activityList}>
                {recentActivity.map(activity => (
                  <div key={activity.id} className={cn(commonStyles.activityItem, themeStyles.activityItem)}>
                    <div className={cn(commonStyles.activityDot, themeStyles.activityDot)} />
                    <div className={commonStyles.activityContent}>
                      <p className={cn(commonStyles.activityDesc, themeStyles.activityDesc)}>
                        {activity.description}
                      </p>
                      <div className={commonStyles.activityMeta}>
                        {activity.user && (
                          <span className={cn(commonStyles.activityUser, themeStyles.activityUser)}>
                            {activity.user}
                          </span>
                        )}
                        <span className={cn(commonStyles.activityTime, themeStyles.activityTime)}>
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
