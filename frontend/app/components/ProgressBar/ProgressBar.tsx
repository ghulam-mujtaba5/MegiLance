'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import commonStyles from './ProgressBar.common.module.css';
import lightStyles from './ProgressBar.light.module.css';
import darkStyles from './ProgressBar.dark.module.css';

// @AI-HINT: This component has been fully refactored to use theme-aware CSS modules and the `cn` utility for dynamic class composition.

interface ProgressBarProps {
  progress: number; // A value from 0 to 100
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  label?: string;
  showPercentage?: boolean;
  animated?: boolean;
  striped?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const sizeMap = {
  xs: 'progressBarXs',
  sm: 'progressBarSm',
  md: 'progressBarMd',
  lg: 'progressBarLg',
  xl: 'progressBarXl',
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = 'md',
  variant = 'default',
  label,
  showPercentage = false,
  animated = false,
  striped = false,
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  const progressId = React.useId();
  const safeProgress = Math.min(100, Math.max(0, progress || 0));

  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  const styles = { ...commonStyles, ...themeStyles };

  const sizeClass = styles[sizeMap[size]];

  return (
    <div className={cn(styles.progressBarContainer, className)}>
      {(label || showPercentage) && (
        <div className={styles.progressBarHeader}>
          {label && (
            <span className={styles.progressBarLabel} id={`${progressId}-label`}>
              {label}
            </span>
          )}
          {showPercentage && (
            <span className={styles.progressBarPercentage}>
              {Math.round(safeProgress)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          styles.progressBar,
          theme === 'dark' ? styles.progressBarDark : styles.progressBarLight,
          sizeClass,
          styles[variant],
          striped && styles.progressBarStriped,
          animated && styles.progressStripeAnimation
        )}
        role="progressbar"
        aria-valuenow={safeProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel || (label ? undefined : `Progress: ${Math.round(safeProgress)}%`)}
        aria-labelledby={label ? `${progressId}-label` : undefined}
        aria-describedby={ariaDescribedBy}
      >
        <div className={styles.progressBarTrack}>
          <div
            className={styles.progressBarFill}
            style={{ '--progress-width': `${safeProgress}%` } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
