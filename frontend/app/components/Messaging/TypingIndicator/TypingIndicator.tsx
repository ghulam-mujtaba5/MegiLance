// @AI-HINT: This component displays a theme-aware, animated typing indicator. It uses global CSS variables for all colors, ensuring it matches the application's current theme.
'use client';

import React from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import commonStyles from './TypingIndicator.common.module.css';
import lightStyles from './TypingIndicator.light.module.css';
import darkStyles from './TypingIndicator.dark.module.css';

const TypingIndicator: React.FC = () => {
  const { theme } = useTheme();
  if (!theme) return null;

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={cn(commonStyles.dot, themeStyles.dot)}></div>
      <div className={cn(commonStyles.dot, themeStyles.dot)}></div>
      <div className={cn(commonStyles.dot, themeStyles.dot)}></div>
    </div>
  );
};

export default TypingIndicator;
