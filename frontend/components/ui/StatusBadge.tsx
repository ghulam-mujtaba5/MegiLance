// @AI-HINT: StatusBadge - reusable colored status indicator
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './StatusBadge.common.module.css';
import lightStyles from './StatusBadge.light.module.css';
import darkStyles from './StatusBadge.dark.module.css';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ variant, children, icon }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <span
      className={cn(commonStyles.badge, themeStyles.badge)}
      data-variant={variant}
    >
      {icon && <span className={commonStyles.icon}>{icon}</span>}
      {children}
    </span>
  );
};
