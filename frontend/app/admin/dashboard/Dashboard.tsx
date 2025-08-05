// @AI-HINT: This is the main Admin Dashboard page, providing an overview of platform activity. All styles are per-component only.
'use client';

import React, { useState, useEffect } from 'react';
import DashboardWidget from '@/app/components/DashboardWidget/DashboardWidget';
import commonStyles from './Dashboard.common.module.css';
import lightStyles from './Dashboard.light.module.css';
import darkStyles from './Dashboard.dark.module.css';
import { useTheme } from '@/app/contexts/ThemeContext';

// @AI-HINT: This is the main Admin Dashboard page, providing an overview of platform activity. All styles are per-component only. Now fully theme-switchable using global theme context.

interface AdminStats {
  totalUsers: number;
  activeProjects: number;
  totalTransactions: number;
  pendingTickets: number;
}

interface Registration {
  id: string;
  name: string;
  date: string;
  type: string;
}

interface FlaggedProject {
  id: string;
  title: string;
  reason: string;
}

interface AdminDashboardData {
  stats: AdminStats;
  recentRegistrations: Registration[];
  flaggedProjects: FlaggedProject[];
}

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch admin dashboard data');
        }
        const result: AdminDashboardData = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="AdminDashboard-status">Loading Admin Dashboard...</div>;
  }

  if (error) {
    return <div className="AdminDashboard-status AdminDashboard-error">Error: {error}</div>;
  }

  if (!data) {
    return <div className="AdminDashboard-status">No data available.</div>;
  }

  const { stats, recentRegistrations, flaggedProjects } = data;

  return (
    <div className={`${commonStyles.adminDashboard} ${themeStyles.adminDashboard}`}>
      <header className={commonStyles.header}>
        <h1>Admin Dashboard</h1>
      </header>

      <div className={commonStyles.widgets}>
        <DashboardWidget title="Total Users" value={stats.totalUsers.toLocaleString()} />
        <DashboardWidget title="Active Projects" value={stats.activeProjects.toLocaleString()} />
        <DashboardWidget title="Total Transactions" value={stats.totalTransactions.toLocaleString()} />
        <DashboardWidget title="Pending Support Tickets" value={stats.pendingTickets.toLocaleString()} />
      </div>

      <div className={commonStyles.lists}>
        <div className={`${commonStyles.listCard} ${themeStyles.listCard}`}>
          <h2>Recent Registrations</h2>
          <ul>
            {recentRegistrations.map(user => (
              <li key={user.id}>
                <span>{user.name} ({user.type})</span>
                <span>{user.date}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={`List-card List-card--${theme}`}>
          <h2>Flagged Projects</h2>
          <ul>
            {flaggedProjects.map(project => (
              <li key={project.id}>
                <span>{project.title}</span>
                <span className="flagged-reason">{project.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
