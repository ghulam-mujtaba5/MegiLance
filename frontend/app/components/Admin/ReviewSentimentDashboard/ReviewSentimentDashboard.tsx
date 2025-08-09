// @AI-HINT: This component provides a fully theme-aware dashboard to visualize review sentiment. It uses the self-contained BarChart component and passes brand-aligned colors for data visualization, ensuring a consistent and premium user experience.
'use client';

import React from 'react';
import BarChart from '@/app/components/BarChart/BarChart';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './ReviewSentimentDashboard.common.module.css';
import lightStyles from './ReviewSentimentDashboard.light.module.css';
import darkStyles from './ReviewSentimentDashboard.dark.module.css';

// Mock data for the dashboard
const sentimentData = {
  overall: 78,
  positive: 1250,
  neutral: 300,
  negative: 80,
  breakdown: [
    { sentiment: 'Positive', percentage: 78 },
    { sentiment: 'Neutral', percentage: 18 },
    { sentiment: 'Negative', percentage: 4 },
  ],
};

const ReviewSentimentDashboard: React.FC = () => {
  const { theme } = useTheme();

  const sentimentColors = {
    Positive: '#27AE60', // MegiLance Success Green
    Neutral: '#F2C94C',  // MegiLance Warning Yellow
    Negative: '#e81123',  // MegiLance Error Red
  };

  const chartData = sentimentData.breakdown.map(item => ({
    label: item.sentiment,
    value: item.percentage,
    color: sentimentColors[item.sentiment as keyof typeof sentimentColors],
  }));

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.reviewSentimentDashboardContainer, themeStyles.reviewSentimentDashboardContainer)}>
      <h2 className={cn(commonStyles.reviewSentimentDashboardTitle, themeStyles.reviewSentimentDashboardTitle)}>Review Sentiment Dashboard</h2>
      <div className={cn(commonStyles.reviewSentimentDashboardGrid, themeStyles.reviewSentimentDashboardGrid)}>
        <div className={cn(commonStyles.reviewSentimentDashboardCard, themeStyles.reviewSentimentDashboardCard)}>
          <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>Overall Sentiment Score</h3>
          <p className={cn(commonStyles.cardMetric, themeStyles.cardMetric, themeStyles.cardMetricPositive)}>{sentimentData.overall}%</p>
          <p className={cn(commonStyles.cardDescription, themeStyles.cardDescription)}>Based on {sentimentData.positive + sentimentData.neutral + sentimentData.negative} reviews</p>
        </div>
        <div className={cn(commonStyles.reviewSentimentDashboardCard, themeStyles.reviewSentimentDashboardCard)}>
          <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>Sentiment Breakdown</h3>
          <BarChart data={chartData} />
        </div>
      </div>
    </div>
  );
};

export default ReviewSentimentDashboard;
