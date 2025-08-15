// @AI-HINT: This is a versatile, enterprise-grade Button component for all user actions. It supports multiple variants (primary, secondary), sizes, loading/disabled states, and icons. All styles are per-component only.

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

import baseStyles from './Button.base.module.css';
import lightStyles from './Button.light.module.css';
import darkStyles from './Button.dark.module.css';

// Base props for the button, independent of the element type
export interface ButtonOwnProps<E extends React.ElementType = React.ElementType> {
  as?: E;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link' | 'success' | 'warning' | 'social' | 'outline';
  // supports legacy size names for backwards-compat
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'small' | 'medium' | 'large';
  isLoading?: boolean;
  fullWidth?: boolean;
  provider?: 'google' | 'github';
  iconBefore?: React.ReactNode;
  iconAfter?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

// Combined props including standard HTML attributes
export type ButtonProps<C extends React.ElementType = 'button'> = ButtonOwnProps<C> & Omit<React.ComponentProps<C>, keyof ButtonOwnProps<C>>;

const Button = <C extends React.ElementType = 'button'>({
  children,
  as,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  iconBefore,
  iconAfter,
  provider,
  className = '',
  ...props
}: ButtonProps<C>) => {
  const { theme } = useTheme();
  const Component = (as || 'button') as React.ElementType;

  if (!theme) return null; // Or a loading skeleton

  // normalize legacy size values
  const normalizedSize: 'sm' | 'md' | 'lg' | 'icon' =
    size === 'small' ? 'sm' : size === 'medium' ? 'md' : size === 'large' ? 'lg' : (size as 'sm' | 'md' | 'lg' | 'icon');

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <Component
      className={cn(
        baseStyles.button,
        // Support both prefixed and non-prefixed variant and size class names
        baseStyles[`variant-${variant}`],
        (baseStyles as any)[variant],
        baseStyles[`size-${normalizedSize}`],
        // legacy, in case any stylesheet references .small/.medium/.large directly
        (baseStyles as any)[size as string],
        themeStyles.button,
        themeStyles[`variant-${variant}`],
        (themeStyles as any)[variant],
        themeStyles[`size-${normalizedSize}`],
        provider && themeStyles[`provider-${provider}`],
        isLoading && baseStyles.loading,
        isLoading && themeStyles.loading,
        fullWidth && baseStyles.fullWidth,
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className={cn(baseStyles.spinner, themeStyles.spinner)} />}
      {iconBefore && !isLoading && <span className={baseStyles.iconBefore}>{iconBefore}</span>}
      <span className={cn(baseStyles.buttonText, themeStyles.buttonText, isLoading && baseStyles.loadingText)}>
        {children}
      </span>
      {iconAfter && !isLoading && <span className={baseStyles.iconAfter}>{iconAfter}</span>}
    </Component>
  );
};

export default Button;
