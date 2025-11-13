// @AI-HINT: LoadingSpinner - animated loading indicator
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import commonStyles from './LoadingSpinner.common.module.css';
import lightStyles from './LoadingSpinner.light.module.css';
import darkStyles from './LoadingSpinner.dark.module.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const sizeMap = { sm: 20, md: 32, lg: 48 };

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <Loader2 size={sizeMap[size]} className={cn(commonStyles.spinner, themeStyles.spinner)} />
      {text && <p className={cn(commonStyles.text, themeStyles.text)}>{text}</p>}
    </div>
  );
};
