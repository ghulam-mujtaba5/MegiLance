// @AI-HINT: Analytics dashboard component with charts and metrics
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Users, DollarSign, CheckCircle, Trophy } from 'lucide-react';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer } from '@/app/components/Animations/StaggerContainer';

import commonStyles from './AnalyticsDashboard.common.module.css';
import lightStyles from './AnalyticsDashboard.light.module.css';
import darkStyles from './AnalyticsDashboard.dark.module.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardSummary {
  total_users: number;
  active_projects: number;
  total_revenue: number;
  completion_rate: number;
}

const AnalyticsDashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [userDistribution, setUserDistribution] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    container: cn(commonStyles.container, themeStyles.container),
    header: cn(commonStyles.header, themeStyles.header),
    title: cn(commonStyles.title, themeStyles.title),
    metricsGrid: cn(commonStyles.metricsGrid, themeStyles.metricsGrid),
    metricCard: cn(commonStyles.metricCard, themeStyles.metricCard),
    metricIcon: cn(commonStyles.metricIcon, themeStyles.metricIcon),
    metricValue: cn(commonStyles.metricValue, themeStyles.metricValue),
    metricLabel: cn(commonStyles.metricLabel, themeStyles.metricLabel),
    chartsGrid: cn(commonStyles.chartsGrid, themeStyles.chartsGrid),
    chartCard: cn(commonStyles.chartCard, themeStyles.chartCard),
    chartTitle: cn(commonStyles.chartTitle, themeStyles.chartTitle),
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Parallel fetch for better performance
      const [summaryRes, regRes, revRes, userStatsRes, completionRes] = await Promise.allSettled([
        api.analytics.getDashboardSummary(),
        api.analytics.getRegistrationTrends(startDate, endDate),
        api.analytics.getRevenueTrends(startDate, endDate),
        api.analytics.getActiveUserStats(),
        api.analytics.getCompletionRate()
      ]);

      // Process Summary
      if (summaryRes.status === 'fulfilled' && completionRes.status === 'fulfilled') {
        const s = summaryRes.value as any;
        const c = completionRes.value as any;
        setSummary({
          total_users: s.users?.total_users || 0,
          active_projects: s.projects?.status_breakdown?.in_progress || 0,
          total_revenue: s.revenue?.total_revenue || 0,
          completion_rate: (c.completion_rate || 0) / 100 // Convert 0-100 to 0-1
        });
      }

      // Process Registration Trends
      if (regRes.status === 'fulfilled') {
        const data = regRes.value;
        setRegistrationData({
          labels: Array.isArray(data) ? data.map((d: any) => d.date) : [],
          datasets: [
            {
              label: 'New Registrations',
              data: Array.isArray(data) ? data.map((d: any) => d.total) : [],
              borderColor: '#4573df',
              backgroundColor: 'rgba(69, 115, 223, 0.1)',
              fill: true,
              tension: 0.4,
            },
          ],
        });
      }

      // Process Revenue Trends
      if (revRes.status === 'fulfilled') {
        const data = revRes.value;
        setRevenueData({
          labels: Array.isArray(data) ? data.map((d: any) => d.date) : [],
          datasets: [
            {
              label: 'Revenue ($)',
              data: Array.isArray(data) ? data.map((d: any) => d.revenue) : [],
              backgroundColor: '#27AE60',
              borderColor: '#27AE60',
              borderWidth: 2,
            },
          ],
        });
      }

      // Process User Distribution
      if (userStatsRes.status === 'fulfilled') {
        const data = userStatsRes.value as any;
        const types = data.user_types || {};
        setUserDistribution({
          labels: ['Freelancers', 'Clients', 'Admins'],
          datasets: [
            {
              data: [
                types.freelancer || 0,
                types.client || 0,
                types.admin || 0
              ],
              backgroundColor: ['#4573df', '#ff9800', '#e81123'],
              borderColor: resolvedTheme === 'dark' ? '#1e293b' : '#ffffff',
              borderWidth: 2,
            },
          ],
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: resolvedTheme === 'dark' ? '#cbd5e1' : '#4b5563',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: resolvedTheme === 'dark' ? '#cbd5e1' : '#4b5563',
        },
        grid: {
          color: resolvedTheme === 'dark' ? '#334155' : '#e5e7eb',
        },
      },
      y: {
        ticks: {
          color: resolvedTheme === 'dark' ? '#cbd5e1' : '#4b5563',
        },
        grid: {
          color: resolvedTheme === 'dark' ? '#334155' : '#e5e7eb',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: resolvedTheme === 'dark' ? '#cbd5e1' : '#4b5563',
        },
      },
    },
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={styles.container}>
        <ScrollReveal>
          <div className={styles.header}>
            <h1 className={styles.title}>Analytics Dashboard</h1>
          </div>
        </ScrollReveal>

        {/* Metrics Summary */}
        <ScrollReveal delay={0.1}>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={cn(styles.metricIcon, 'bg-blue-500')}>
                <Users size={24} color="#ffffff" />
              </div>
              <div>
                <div className={styles.metricValue}>{summary?.total_users || 0}</div>
                <div className={styles.metricLabel}>Total Users</div>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={cn(styles.metricIcon, 'bg-orange-500')}>
                <Trophy size={24} color="#ffffff" />
              </div>
              <div>
                <div className={styles.metricValue}>{summary?.active_projects || 0}</div>
                <div className={styles.metricLabel}>Active Projects</div>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={cn(styles.metricIcon, 'bg-green-500')}>
                <DollarSign size={24} color="#ffffff" />
              </div>
              <div>
                <div className={styles.metricValue}>
                  ${((summary?.total_revenue || 0) / 100).toFixed(2)}
                </div>
                <div className={styles.metricLabel}>Total Revenue</div>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={cn(styles.metricIcon, 'bg-purple-500')}>
                <CheckCircle size={24} color="#ffffff" />
              </div>
              <div>
                <div className={styles.metricValue}>
                  {((summary?.completion_rate || 0) * 100).toFixed(1)}%
                </div>
                <div className={styles.metricLabel}>Completion Rate</div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Charts */}
        <StaggerContainer delay={0.2} className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Registration Trends (30 Days)</h2>
            {registrationData && (
              <div style={{ height: '300px' }}>
                <Line data={registrationData} options={chartOptions} />
              </div>
            )}
          </div>

          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Revenue Trends (30 Days)</h2>
            {revenueData && (
              <div style={{ height: '300px' }}>
                <Bar data={revenueData} options={chartOptions} />
              </div>
            )}
          </div>

          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>User Distribution</h2>
            {userDistribution && (
              <div style={{ height: '300px' }}>
                <Doughnut data={userDistribution} options={doughnutOptions} />
              </div>
            )}
          </div>
        </StaggerContainer>
      </div>
    </PageTransition>
  );
};

export default AnalyticsDashboard;
