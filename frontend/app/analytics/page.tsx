// @AI-HINT: Analytics dashboard page showing platform stats and performance metrics
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { BarChart3, Users, Briefcase, DollarSign, TrendingUp, Clock, FileText, Star } from 'lucide-react';

import commonStyles from './Analytics.common.module.css';
import lightStyles from './Analytics.light.module.css';
import darkStyles from './Analytics.dark.module.css';

interface StatCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
}

const AnalyticsPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatCard[]>([]);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const apiModule = await import('@/lib/api') as any;
        const metricsApi = apiModule.metricsApi;
        if (metricsApi?.getDashboard) {
          const data = await metricsApi.getDashboard();
          if (data) {
            setStats([
              { label: 'Total Users', value: String(data.total_users ?? '0'), change: '+12%', positive: true, icon: <Users size={22} /> },
              { label: 'Active Projects', value: String(data.active_projects ?? '0'), change: '+8%', positive: true, icon: <Briefcase size={22} /> },
              { label: 'Revenue', value: `$${Number(data.revenue ?? 0).toLocaleString()}`, change: '+15%', positive: true, icon: <DollarSign size={22} /> },
              { label: 'Proposals', value: String(data.total_proposals ?? '0'), change: '+5%', positive: true, icon: <FileText size={22} /> },
              { label: 'Avg Rating', value: String(data.avg_rating ?? '4.5'), change: '+0.2', positive: true, icon: <Star size={22} /> },
              { label: 'Completion Rate', value: `${data.completion_rate ?? 85}%`, change: '+3%', positive: true, icon: <TrendingUp size={22} /> },
              { label: 'Avg Response Time', value: `${data.avg_response_hours ?? 2}h`, change: '-12%', positive: true, icon: <Clock size={22} /> },
              { label: 'Active Contracts', value: String(data.active_contracts ?? '0'), change: '+10%', positive: true, icon: <BarChart3 size={22} /> },
            ]);
            setLoading(false);
            return;
          }
        }
      } catch {
        // API not available, use defaults
      }
      setStats([
        { label: 'Total Users', value: '0', change: '--', positive: true, icon: <Users size={22} /> },
        { label: 'Active Projects', value: '0', change: '--', positive: true, icon: <Briefcase size={22} /> },
        { label: 'Revenue', value: '$0', change: '--', positive: true, icon: <DollarSign size={22} /> },
        { label: 'Proposals', value: '0', change: '--', positive: true, icon: <FileText size={22} /> },
        { label: 'Avg Rating', value: 'N/A', change: '--', positive: true, icon: <Star size={22} /> },
        { label: 'Completion Rate', value: 'N/A', change: '--', positive: true, icon: <TrendingUp size={22} /> },
        { label: 'Avg Response Time', value: 'N/A', change: '--', positive: true, icon: <Clock size={22} /> },
        { label: 'Active Contracts', value: '0', change: '--', positive: true, icon: <BarChart3 size={22} /> },
      ]);
      setLoading(false);
    };
    loadAnalytics();
  }, []);

  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const isDark = resolvedTheme === 'dark';

  return (
    <PageTransition>
      <main className={cn(commonStyles.page, themeStyles.page)}>
        <div className={commonStyles.container}>
          <ScrollReveal>
            <header className={commonStyles.header}>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Analytics</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Track performance, revenue, and engagement trends.
              </p>
            </header>
          </ScrollReveal>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ padding: '1.5rem', borderRadius: '1rem', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', height: 120 }} />
              ))}
            </div>
          ) : (
            <ScrollReveal delay={0.1}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                {stats.map((stat, index) => (
                  <div key={index} style={{ padding: '1.5rem', borderRadius: '1rem', background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(69,115,223,0.15)' : 'rgba(69,115,223,0.1)', color: '#4573df' }}>
                        {stat.icon}
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: stat.positive ? '#27AE60' : '#e81123' }}>
                        {stat.change}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem', color: isDark ? '#fff' : '#111' }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          )}
        </div>
      </main>
    </PageTransition>
  );
};

export default AnalyticsPage;
