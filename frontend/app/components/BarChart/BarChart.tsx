// @AI-HINT: This component renders a fully theme-aware, dynamic bar chart. It accepts an array of data items, including an optional color property for each bar, making it highly reusable. All styles are self-contained.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './BarChart.common.module.css';
import lightStyles from './BarChart.light.module.css';
import darkStyles from './BarChart.dark.module.css';

export interface BarChartDataItem {
  label: string;
  value: number;
  color?: string; // Optional: Will default to theme's accent color if not provided.
}

interface BarChartProps {
  data: BarChartDataItem[];
  className?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, className }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.barChart, themeStyles.barChart, className)}>
      {data.map(item => {
        const safeValue = Math.min(100, Math.max(0, item.value || 0));
        const barStyle = {
          width: `${safeValue}%`,
          backgroundColor: item.color, // Directly apply color
        } as React.CSSProperties;

        return (
          <div key={item.label} className={cn(commonStyles.barChartBarContainer, themeStyles.barChartBarContainer)}>
            <span className={cn(commonStyles.barChartLabel, themeStyles.barChartLabel)}>{item.label}</span>
            <div className={cn(commonStyles.barChartBarWrapper, themeStyles.barChartBarWrapper)}>
              <div
                className={cn(commonStyles.barChartBar, themeStyles.barChartBar)}
                style={barStyle}
                role="progressbar"
                aria-valuenow={safeValue}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${item.label}: ${item.value}%`}
              ></div>
            </div>
            <span className={cn(commonStyles.barChartPercentage, themeStyles.barChartPercentage)}>{item.value}%</span>
          </div>
        );
      })}
    </div>
  );
};

export default BarChart;
