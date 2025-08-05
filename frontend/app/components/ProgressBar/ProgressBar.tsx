// @AI-HINT: This is a ProgressBar component, an atomic element used for displaying progress.
'use client';

import React from 'react';
import commonStyles from './ProgressBar.common.module.css';
import lightStyles from './ProgressBar.light.module.css';
import darkStyles from './ProgressBar.dark.module.css';
import { useTheme } from '@/app/contexts/ThemeContext';
// @AI-HINT: This is a ProgressBar component, now fully theme-switchable using global theme context and per-component CSS modules.

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
  'aria-describedby': ariaDescribedBy
}) => {
  const progressId = React.useId();
  const safeProgress = Math.min(100, Math.max(0, progress || 0));
  
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  const progressBarClasses = [
    commonStyles.progressBar,
    themeStyles.progressBar,
    commonStyles[`size-${size}`],
    themeStyles[`size-${size}`],
    commonStyles[`variant-${variant}`],
    themeStyles[`variant-${variant}`],
    striped && commonStyles.striped,
    striped && themeStyles.striped,
    animated && commonStyles.animated,
    animated && themeStyles.animated,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={`${commonStyles.container} ${themeStyles.container}`}>
      {(label || showPercentage) && (
        <div className={`${commonStyles.header} ${themeStyles.header}`}>
          {label && (
            <span className={commonStyles.label} id={`${progressId}-label`}>
              {label}
            </span>
          )}
          {showPercentage && (
            <span className={commonStyles.percentage}>
              {Math.round(safeProgress)}%
            </span>
          )}
        </div>
      )}
      <div
        className={progressBarClasses}
        role="progressbar"
        aria-valuenow={safeProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel || (label ? undefined : `Progress: ${Math.round(safeProgress)}%`)}
        aria-labelledby={label ? `${progressId}-label` : undefined}
        aria-describedby={ariaDescribedBy}
      >
        <div className={`${commonStyles.track} ${themeStyles.track}`}>
          <div className={`${commonStyles.fill} ${themeStyles.fill}`} style={{ '--progress-width': `${safeProgress}%` } as React.CSSProperties} />
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
