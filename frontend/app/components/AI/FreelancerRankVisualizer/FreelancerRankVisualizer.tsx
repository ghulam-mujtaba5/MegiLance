// @AI-HINT: This component provides a premium, visual representation of a freelancer's rank within a DashboardWidget, featuring an SVG radial progress indicator and theme-aware styling.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import DashboardWidget from '@/app/components/DashboardWidget/DashboardWidget';
import { Award, Gem, Medal, Shield, Trophy } from 'lucide-react';

import commonStyles from './FreelancerRankVisualizer.common.module.css';
import lightStyles from './FreelancerRankVisualizer.light.module.css';
import darkStyles from './FreelancerRankVisualizer.dark.module.css';

interface FreelancerRankVisualizerProps {
  rank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'N/A';
  score: number; // A score from 0 to 1000
  className?: string;
}

const rankTiers = {
  'Bronze': { icon: Medal, color: '#cd7f32', next: 'Silver', goal: 450 },
  'Silver': { icon: Award, color: '#c0c0c0', next: 'Gold', goal: 650 },
  'Gold': { icon: Trophy, color: '#ffd700', next: 'Platinum', goal: 850 },
  'Platinum': { icon: Shield, color: '#e5e4e2', next: 'Diamond', goal: 950 },
  'Diamond': { icon: Gem, color: '#b9f2ff', next: null, goal: 1000 },
  'N/A': { icon: Medal, color: '#9ca3af', next: 'Bronze', goal: 250 },
};

const RadialProgress: React.FC<{ radius: number; stroke: number; theme: string }> = ({ radius, stroke, theme }) => {
  const themed = theme === 'dark' ? darkStyles : lightStyles;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  return (
    <svg height={radius * 2} width={radius * 2} className={commonStyles.radialSvg}>
      <circle
        className={cn(commonStyles.radialBg, themed.radialBg)}
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        className={cn(commonStyles.radialProgress, themed.radialProgress)}
        strokeWidth={stroke}
        strokeDasharray={circumference + ' ' + circumference}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </svg>
  );
};

const FreelancerRankVisualizer: React.FC<FreelancerRankVisualizerProps> = ({ rank, score, className }) => {
  const { resolvedTheme } = useTheme();
  if (!resolvedTheme) return null; // Or a loading skeleton

  const currentRank = rankTiers[rank] || rankTiers['N/A'];
  const RankIcon = currentRank.icon;
  
  const normalizedScore = Math.min(Math.max(score, 0), 1000);
  const progressPercentage = (normalizedScore / 1000) * 100;
  const pointsToNext = currentRank.next ? currentRank.goal - score : 0;

  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  const dynamicStyles = {
    '--progress-color': currentRank.color,
    '--stroke-offset': `${strokeDashoffset}px`,
    '--rank-color': currentRank.color,
  } as React.CSSProperties;

  return (
    <DashboardWidget 
      title="Current Rank" 
      icon={RankIcon} 
      className={cn(commonStyles.widgetContainer, className)} 
      iconColor={currentRank.color}
      style={dynamicStyles}
    >
      <div className={commonStyles.contentWrapper}>
        <div className={commonStyles.progressContainer}>
          <RadialProgress radius={radius} stroke={stroke} theme={resolvedTheme} />
          <div className={commonStyles.progressTextContainer}>
            <p className={cn(commonStyles.scoreValue, resolvedTheme === 'dark' ? darkStyles.scoreValue : lightStyles.scoreValue)}>{score}</p>
            <p className={cn(commonStyles.scoreLabel, resolvedTheme === 'dark' ? darkStyles.scoreLabel : lightStyles.scoreLabel)}>Score</p>
          </div>
        </div>
        <div className={commonStyles.detailsContainer}>
          <h3 className={commonStyles.rankName}>{rank} Tier</h3>
          {currentRank.next && (
            <p className={cn(commonStyles.nextRankInfo, resolvedTheme === 'dark' ? darkStyles.nextRankInfo : lightStyles.nextRankInfo)}>
              {pointsToNext > 0 ? 
                `+${pointsToNext} points to ${currentRank.next}` :
                `You've reached the top tier!`
              }
            </p>
          )}
        </div>
      </div>
    </DashboardWidget>
  );
};

export default FreelancerRankVisualizer;
