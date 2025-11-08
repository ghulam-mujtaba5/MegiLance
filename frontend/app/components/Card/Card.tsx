// @AI-HINT: This is a versatile and reusable Card component. It serves as a container for content sections and is fully theme-aware, adapting its styles based on the global theme context.

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import commonStyles from './Card.common.module.css';
import lightStyles from './Card.light.module.css';
import darkStyles from './Card.dark.module.css';

export interface CardProps {
  title?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outline' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  title, 
  icon: Icon, 
  children, 
  className = '',
  variant = 'default',
  size = 'md',
  loading = false
}) => {
  const { resolvedTheme } = useTheme();

  if (!resolvedTheme) {
    return null; // Don't render until theme is resolved to prevent flash
  }

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(
      commonStyles.card,
      themeStyles.card,
      commonStyles[`variant-${variant}`],
      commonStyles[`size-${size}`],
      loading && commonStyles.loading,
      className
    )}>
      {title && (
        <div className={cn(commonStyles.cardHeader, themeStyles.cardHeader)}>
          {Icon && <Icon className={cn(commonStyles.cardIcon, themeStyles.cardIcon)} size={24} />}
          <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>{title}</h3>
        </div>
      )}
      <div className={cn(commonStyles.cardContent, themeStyles.cardContent)}>
        {children}
      </div>
    </div>
  );
};

export default Card;