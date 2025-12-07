// @AI-HINT: This component renders the MegiLance SVG logo and is fully theme-aware.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './MegiLanceLogo.common.module.css';
import lightStyles from './MegiLanceLogo.light.module.css';
import darkStyles from './MegiLanceLogo.dark.module.css';

export const MegiLanceLogo: React.FC<{ className?: string }> = ({ className }) => {
  const { resolvedTheme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  // Always render the logo to avoid hydration mismatch
  // Server will render with default theme, client will hydrate correctly
  return (
    <div className={cn(commonStyles.logoWrapper, className)}>
      <svg
        className={commonStyles.logoSvg}
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="MegiLance Logo"
        role="img"
      >
        <title>MegiLance Logo</title>
        <desc>MegiLance brand logo featuring a connected M symbol representing the freelancer network, with an orange node for AI.</desc>
        <defs>
          <linearGradient id="brandGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4573df" />
            <stop offset="100%" stopColor="#2c5bb5" />
          </linearGradient>
        </defs>

        {/* Background Container */}
        <rect width="32" height="32" rx="8" fill="url(#brandGradient)" />

        {/* The "M" Network Symbol - Clean, Geometric, Professional */}
        <path 
          d="M8 22 V11 L16 19 L24 11 V22" 
          stroke="white" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
        />

        {/* The AI Spark - Accent Orange Node */}
        {/* Positioned at the top right vertex to symbolize 'Intelligence' leading the network */}
        <circle className={commonStyles.aiNode} cx="24" cy="11" r="2" fill="#ff9800" stroke="white" strokeWidth="0.5" />

      </svg>
    </div>
  );
};

export default MegiLanceLogo;
