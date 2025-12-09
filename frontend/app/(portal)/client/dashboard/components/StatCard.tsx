import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import commonStyles from './StatCard.common.module.css';
import lightStyles from './StatCard.light.module.css';
import darkStyles from './StatCard.dark.module.css';

interface StatCardProps {
  title: string;
  value: string;
  trend?: number;
  icon: React.ElementType;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, icon: Icon }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <div className={cn(commonStyles.card, themeStyles.card)}>
      <div className={commonStyles.header}>
        <span className={cn(commonStyles.title, themeStyles.title)}>{title}</span>
        <div className={cn(commonStyles.iconWrapper, themeStyles.iconWrapper)}>
          <Icon size={20} />
        </div>
      </div>
      <div className={commonStyles.content}>
        <div className={cn(commonStyles.value, themeStyles.value)}>{value}</div>
        {trend !== undefined && (
          <div className={cn(commonStyles.trend, isPositive ? commonStyles.trendUp : isNegative ? commonStyles.trendDown : commonStyles.trendNeutral)}>
            {isPositive ? <TrendingUp size={16} /> : isNegative ? <TrendingDown size={16} /> : null}
            <span className={commonStyles.trendValue}>{Math.abs(trend)}%</span>
            <span className={cn(commonStyles.trendLabel, themeStyles.trendLabel)}>vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
