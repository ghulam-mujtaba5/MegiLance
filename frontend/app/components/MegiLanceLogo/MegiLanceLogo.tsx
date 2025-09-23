// @AI-HINT: This component renders the MegiLance SVG logo and is fully theme-aware.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './MegiLanceLogo.common.module.css';
import lightStyles from './MegiLanceLogo.light.module.css';
import darkStyles from './MegiLanceLogo.dark.module.css';

export const MegiLanceLogo: React.FC<{ className?: string }> = ({ className }) => {
  const { theme } = useTheme();
  const themeStyles = theme === 'light' ? lightStyles : darkStyles;

  if (!theme) return null;

  return (
    <svg
      className={cn(commonStyles.logo, className)}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="MegiLance Logo"
      role="img"
    >
      <title>MegiLance Logo</title>
      <desc>MegiLance brand logo featuring stylized M lettermark with AI neural network connections</desc>
      <defs>
        <linearGradient id="brandGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={theme === 'dark' ? '#4573df' : '#4573df'} />
          <stop offset="100%" stopColor={theme === 'dark' ? '#6b8ff0' : '#6b8ff0'} />
        </linearGradient>
        <linearGradient id="neuralGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      
      {/* Background with gradient */}
      <rect width="32" height="32" rx="8" fill="url(#brandGradient)" />
      
      {/* Neural network connections (subtle background pattern) */}
      <g opacity="0.3">
        <circle cx="8" cy="8" r="1" fill="url(#neuralGradient)" />
        <circle cx="24" cy="8" r="1" fill="url(#neuralGradient)" />
        <circle cx="8" cy="24" r="1" fill="url(#neuralGradient)" />
        <circle cx="24" cy="24" r="1" fill="url(#neuralGradient)" />
        <line x1="8" y1="8" x2="16" y2="12" stroke="url(#neuralGradient)" strokeWidth="0.5" />
        <line x1="24" y1="8" x2="16" y2="12" stroke="url(#neuralGradient)" strokeWidth="0.5" />
        <line x1="16" y1="20" x2="8" y2="24" stroke="url(#neuralGradient)" strokeWidth="0.5" />
        <line x1="16" y1="20" x2="24" y2="24" stroke="url(#neuralGradient)" strokeWidth="0.5" />
      </g>
      
      {/* Main M lettermark */}
      <path 
        d="M9 23V9H12.5L16 16L19.5 9H23V23H20V12L16.5 19H15.5L12 12V23H9Z" 
        fill="#ffffff"
      />
      
      {/* AI accent dot */}
      <circle cx="25" cy="7" r="2" fill="#ffffff" opacity="0.9" />
      <circle cx="25" cy="7" r="1" fill="#4573df" />
    </svg>
  );
};

export default MegiLanceLogo;
