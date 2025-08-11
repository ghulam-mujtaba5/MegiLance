// @AI-HINT: This component displays a grid of key performance indicators for the freelancer dashboard, using the shared DashboardWidget and FreelancerRankVisualizer for a consistent, premium look.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import DashboardWidget from '@/app/components/DashboardWidget/DashboardWidget';
import FreelancerRankVisualizer from '@/app/components/AI/FreelancerRankVisualizer/FreelancerRankVisualizer';

import commonStyles from './KeyMetricsGrid.common.module.css';
import lightStyles from './KeyMetricsGrid.light.module.css';
import darkStyles from './KeyMetricsGrid.dark.module.css';

const rankToScore: { [key: string]: number } = {
  'Bronze': 250,
  'Silver': 450,
  'Gold': 650,
  'Platinum': 850,
  'Diamond': 950,
  'N/A': 0,
};

interface KeyMetricsGridProps {
  analytics: {
    activeProjects?: number;
    pendingProposals?: number;
    walletBalance?: string;
    rank?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'N/A';
  } | null;
  loading: boolean;
}

const KeyMetricsGrid: React.FC<KeyMetricsGridProps> = ({ analytics, loading }) => {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.widgetsGrid, themeStyles.widgetsGrid)}>
        {[...Array(4)].map((_, i) => (
          <DashboardWidget key={i} title="" value="" loading={true} />
        ))}
      </div>
    );
  }

  const rank = analytics?.rank ?? 'N/A';
  const score = rankToScore[rank] ?? 0;

  return (
    <div className={cn(commonStyles.widgetsGrid, themeStyles.widgetsGrid)} role="region" aria-label="Key metrics">
      <DashboardWidget title="Active Projects" value={String(analytics?.activeProjects ?? 0)} />
      <DashboardWidget title="Pending Proposals" value={String(analytics?.pendingProposals ?? 0)} />
      <DashboardWidget title="Wallet Balance" value={analytics?.walletBalance ?? '$0.00'} />
      <FreelancerRankVisualizer rank={rank} score={score} />
    </div>
  );
};

export default KeyMetricsGrid;
