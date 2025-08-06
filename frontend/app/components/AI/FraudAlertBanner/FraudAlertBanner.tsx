// @AI-HINT: This component displays a fully theme-aware warning banner for potentially fraudulent activity. It uses per-component CSS modules and the cn utility for robust, maintainable styling.
'use client';

import React from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import commonStyles from './FraudAlertBanner.common.module.css';
import lightStyles from './FraudAlertBanner.light.module.css';
import darkStyles from './FraudAlertBanner.dark.module.css';

interface FraudAlertBannerProps {
  message: string;
}

const FraudAlertBanner: React.FC<FraudAlertBannerProps> = ({ message }) => {
  const { theme } = useTheme();
  const themeStyles = theme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(commonStyles.fraudAlertBanner, themeStyles.fraudAlertBanner)}>
      <div className={cn(commonStyles.fraudAlertBannerIcon, themeStyles.fraudAlertBannerIcon)}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M12 1.917l-9.423 16.333h18.846l-9.423-16.333zm0 3.833l6.438 11.167h-12.876l6.438-11.167zm-1 6.25h2v4h-2v-4zm0 5h2v2h-2v-2z"/>
        </svg>
      </div>
      <div className={cn(commonStyles.fraudAlertBannerContent, themeStyles.fraudAlertBannerContent)}>
        <strong>Security Alert:</strong>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default FraudAlertBanner;
