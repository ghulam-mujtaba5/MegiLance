// @AI-HINT: This page displays performance analytics for the freelancer. It's now fully theme-aware and built with a premium, responsive grid layout.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import LineChart from '@/app/components/DataViz/LineChart/LineChart';
import { useFreelancerData } from '@/hooks/useFreelancer';
import commonStyles from './Analytics.common.module.css';
import lightStyles from './Analytics.light.module.css';
import darkStyles from './Analytics.dark.module.css';

const AnalyticsPage: React.FC = () => {
  const { theme } = useTheme();
  const { analytics, loading, error } = useFreelancerData();
  
  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  const analyticsData = useMemo(() => {
    if (!analytics) return null;
    
    const totalEarned = parseFloat(analytics.totalEarnings?.replace(/[$,]/g, '') || '0');
    const activeProjects = analytics.activeProjects || 0;
    const completedProjects = analytics.completedProjects || 0;
    const hireRate = completedProjects > 0 ? ((completedProjects / (activeProjects + completedProjects)) * 100).toFixed(1) + '%' : '0%';
    
    return {
      kpis: {
        profileViews: analytics.profileViews || 0,
        applicationsSent: analytics.pendingProposals || 0,
        hireRate,
        totalEarned,
      },
      viewsOverTime: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [300, 450, 600, 550, 800, analytics.profileViews || 1256],
      },
      earningsOverTime: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [500, 800, 1200, 2000, 3500, totalEarned],
      },
    };
  }, [analytics]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Your Analytics</h1>
        <p className={styles.subtitle}>Track your performance and find new opportunities for growth.</p>
      </header>

      {loading && <div className={styles.loading} aria-busy={loading || undefined}>Loading analytics...</div>}
      {error && <div className={styles.error}>Failed to load analytics data.</div>}

      {analyticsData && (
        <main className={styles.mainContent}>
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Profile Views</span>
              <span className={styles.kpiValue}>{analyticsData.kpis.profileViews}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Applications Sent</span>
              <span className={styles.kpiValue}>{analyticsData.kpis.applicationsSent}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Hire Rate</span>
              <span className={styles.kpiValue}>{analyticsData.kpis.hireRate}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Total Earned (USD)</span>
              <span className={styles.kpiValue}>${analyticsData.kpis.totalEarned.toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.chartGrid}>
            <div className={styles.chartCard}>
              <h2 className={styles.cardTitle}>Profile Views Over Time</h2>
              <LineChart data={analyticsData.viewsOverTime.data} labels={analyticsData.viewsOverTime.labels} />
            </div>

            <div className={styles.chartCard}>
              <h2 className={styles.cardTitle}>Earnings Over Time</h2>
              <LineChart data={analyticsData.earningsOverTime.data} labels={analyticsData.earningsOverTime.labels} />
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default AnalyticsPage;
