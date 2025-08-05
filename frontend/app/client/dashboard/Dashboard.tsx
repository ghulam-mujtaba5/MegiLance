// @AI-HINT: This is the main dashboard for clients to manage their projects and hiring. All styles are per-component only.
'use client';

import React from 'react';
import DashboardWidget from '@/app/components/DashboardWidget/DashboardWidget';
import Button from '@/app/components/Button/Button';
import TransactionRow from '@/app/components/TransactionRow/TransactionRow';
import commonStyles from './Dashboard.common.module.css';
import lightStyles from './Dashboard.light.module.css';
import darkStyles from './Dashboard.dark.module.css';
import { useTheme } from '@/app/contexts/ThemeContext';

// @AI-HINT: This is the main dashboard for clients to manage their projects and hiring. All styles are per-component only. Now fully theme-switchable using global theme context.

const Dashboard: React.FC = () => {
  // Mock data for the client dashboard
  const stats = {
    activeProjects: 3,
    pendingHires: 2,
    totalSpent: 25800,
  };

  const recentProjects = [
    { id: '1', title: 'AI Chatbot Integration', status: 'In Progress', freelancer: 'John D.' },
    { id: '2', title: 'Data Analytics Dashboard', status: 'Awaiting Feedback', freelancer: 'Jane S.' },
    { id: '3', title: 'E-commerce Platform UI/UX', status: 'Completed', freelancer: 'Mike R.' },
  ];

  const recentTransactions = [
    { type: 'payment', amount: -5000, date: '2025-08-01', description: 'Milestone Payment for AI Chatbot' },
    { type: 'payment', amount: -8000, date: '2025-07-15', description: 'Final Payment for E-commerce UI/UX' },
    { type: 'deposit', amount: 15000, date: '2025-07-10', description: 'Wallet Deposit' },
  ];

  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={`${commonStyles.dashboard} ${themeStyles.dashboard}`}>
      <div className={commonStyles.container}>
        <header className={commonStyles.header}>
          <h1>Client Dashboard</h1>
          <Button variant="primary">Post a New Job</Button>
        </header>

        <div className={commonStyles.widgets}>
          <DashboardWidget title="Active Projects" value={stats.activeProjects.toString()} />
          <DashboardWidget title="Pending Hires" value={stats.pendingHires.toString()} />
          <DashboardWidget title="Total Spent" value={`$${stats.totalSpent.toLocaleString()}`} />
        </div>

        <div className={commonStyles.mainContent}>
          <section className={commonStyles.section}>
            <h2>Recent Projects</h2>
            <div className={commonStyles.projectList}>
              {recentProjects.map(p => (
                <div key={p.id} className={commonStyles.projectListItem}>
                  <span>{p.title}</span>
                  <span>{p.freelancer}</span>
                  <span className={commonStyles.status}>{p.status}</span>
                  <Button variant='secondary' size='small'>View Project</Button>
                </div>
              ))}
            </div>
          </section>

          <section className={commonStyles.section}>
            <h2>Recent Transactions</h2>
            <div className={commonStyles.transactionList}>
              {recentTransactions.map((tx, idx) => (
                <TransactionRow key={idx} amount={tx.amount.toString()} date={tx.date} description={tx.description} type={tx.type} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
