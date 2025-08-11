// @AI-HINT: A reusable card component for showcasing AI features with advanced styling and hover effects.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

import commonStyles from './AIShowcaseCard.common.module.css';
import lightStyles from './AIShowcaseCard.light.module.css';
import darkStyles from './AIShowcaseCard.dark.module.css';

interface AIShowcaseCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  stats: string;
}

const AIShowcaseCard: React.FC<AIShowcaseCardProps> = ({ icon, title, description, stats }) => {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.card, themeStyles.card)}>
      <div className={cn(commonStyles.cardGlow, themeStyles.cardGlow)}></div>
      <div className={cn(commonStyles.cardBorder, themeStyles.cardBorder)}></div>
      <div className={cn(commonStyles.cardContent)}>
        <div className={cn(commonStyles.iconWrapper, themeStyles.iconWrapper)}>{icon}</div>
        <h3 className={cn(commonStyles.title, themeStyles.title)}>{title}</h3>
        <p className={cn(commonStyles.description, themeStyles.description)}>{description}</p>
        <div className={cn(commonStyles.footer, themeStyles.footer)}>
          <span className={cn(commonStyles.stats, themeStyles.stats)}>{stats}</span>
          <div className={cn(commonStyles.learnMore, themeStyles.learnMore)}>
            <ArrowRight className={cn(commonStyles.arrowIcon)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIShowcaseCard;

