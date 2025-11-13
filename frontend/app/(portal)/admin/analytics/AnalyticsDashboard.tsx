// @AI-HINT: Analytics dashboard component with charts and metrics
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
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
import { FaUsers, FaDollarSign, FaCheckCircle, FaTrophy } from 'react-icons/fa';

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
      const token = localStorage.getItem('access_token');
      
      // Fetch dashboard summary
      const summaryRes = await fetch('/backend/api/analytics/dashboard/summary', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }

      // Fetch registration trends
      const regRes = await fetch('/backend/api/analytics/registrations/trends?days=30', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (regRes.ok) {
        const data = await regRes.json();
        setRegistrationData({
          labels: data.dates,
          datasets: [
            {
              label: 'New Registrations',
              data: data.counts,
              borderColor: '#4573df',
              backgroundColor: 'rgba(69, 115, 223, 0.1)',
              fill: true,
              tension: 0.4,
            },
          ],
        });
      }

      // Fetch revenue trends
      const revRes = await fetch('/backend/api/analytics/revenue/trends?days=30', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (revRes.ok) {
        const data = await revRes.json();
        setRevenueData({
          labels: data.dates,
          datasets: [
            {
              label: 'Revenue ($)',
              data: data.amounts,
              backgroundColor: '#27AE60',
              borderColor: '#27AE60',
              borderWidth: 2,
            },
          ],
        });
      }

      // Fetch user distribution
      const userRes = await fetch('/backend/api/analytics/users/distribution', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (userRes.ok) {
        const data = await userRes.json();
        setUserDistribution({
          labels: ['Freelancers', 'Clients', 'Admins'],
          datasets: [
            {
              data: [data.freelancers, data.clients, data.admins],
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
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Analytics Dashboard</h1>
      </div>

      {/* Metrics Summary */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={cn(styles.metricIcon, 'bg-blue-500')}>
            <FaUsers size={24} color="#ffffff" />
          </div>
          <div>
            <div className={styles.metricValue}>{summary?.total_users || 0}</div>
            <div className={styles.metricLabel}>Total Users</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={cn(styles.metricIcon, 'bg-orange-500')}>
            <FaTrophy size={24} color="#ffffff" />
          </div>
          <div>
            <div className={styles.metricValue}>{summary?.active_projects || 0}</div>
            <div className={styles.metricLabel}>Active Projects</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={cn(styles.metricIcon, 'bg-green-500')}>
            <FaDollarSign size={24} color="#ffffff" />
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
            <FaCheckCircle size={24} color="#ffffff" />
          </div>
          <div>
            <div className={styles.metricValue}>
              {((summary?.completion_rate || 0) * 100).toFixed(1)}%
            </div>
            <div className={styles.metricLabel}>Completion Rate</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
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
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
