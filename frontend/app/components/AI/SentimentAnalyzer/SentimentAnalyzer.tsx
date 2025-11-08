// @AI-HINT: This component provides a fully theme-aware visual display for text sentiment. It uses per-component CSS modules, the cn utility, and brand-aligned colors for robust, maintainable styling.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './SentimentAnalyzer.common.module.css';
import lightStyles from './SentimentAnalyzer.light.module.css';
import darkStyles from './SentimentAnalyzer.dark.module.css';

interface SentimentAnalyzerProps {
  // A score from -1 (very negative) to 1 (very positive)
  score: number;
  className?: string;
}

const SentimentAnalyzer: React.FC<SentimentAnalyzerProps> = ({ score, className }) => {
  const { resolvedTheme } = useTheme();
  if (!resolvedTheme) return null;

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const getSentimentDetails = (score: number) => {
    if (score > 0.2) {
      return { label: 'Positive', styleClass: themeStyles.positive };
    }
    if (score < -0.2) {
      return { label: 'Negative', styleClass: themeStyles.negative };
    }
    return { label: 'Neutral', styleClass: themeStyles.neutral };
  };

  const { label, styleClass } = getSentimentDetails(score);

  return (
    <div className={cn(commonStyles.container, themeStyles.container, className)}>
      <span className={cn(commonStyles.label, themeStyles.label)}>Sentiment:</span>
      <span className={cn(commonStyles.indicator, styleClass)}>
        {label}
      </span>
    </div>
  );
};

export default SentimentAnalyzer;
