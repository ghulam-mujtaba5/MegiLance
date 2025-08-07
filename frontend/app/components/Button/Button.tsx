// @AI-HINT: This is a versatile, enterprise-grade Button component for all user actions. It supports multiple variants (primary, secondary), sizes, loading/disabled states, and icons. All styles are per-component only.

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

import commonStyles from './Button.common.module.css';
import lightStyles from './Button.light.module.css';
import darkStyles from './Button.dark.module.css';

// Define own props for the button, separating them from the underlying element's props.
// This is the first step in creating a polymorphic component.
type ButtonOwnProps<C extends React.ElementType> = {
  as?: C;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
};

// Combine our own props with the props of the component specified in `as`.
// This creates the final, flexible props type.
export type ButtonProps<C extends React.ElementType> = ButtonOwnProps<C> & 
  Omit<React.ComponentPropsWithoutRef<C>, keyof ButtonOwnProps<C>>;

const Button = <C extends React.ElementType = 'button'> ({
  children,
  as,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  fullWidth = false,
  icon: Icon,
  className = '',
  ...props
}: ButtonProps<C>) => {
  const { theme } = useTheme();

  // The component to render will be what's passed to `as`, or a 'button' by default.
  const Component = as || 'button';

  if (!theme) {
    return null; // Don't render until theme is resolved
  }

  const themeStyles = theme === 'light' ? lightStyles : darkStyles;

  return (
    <Component
      className={cn(
        commonStyles.button,
        themeStyles.button,
        commonStyles[variant],
        themeStyles[variant],
        commonStyles[size],
        themeStyles[size],
        fullWidth && commonStyles.fullWidth,
        fullWidth && themeStyles.fullWidth,
        className
      )}
      disabled={isLoading || (props as React.ButtonHTMLAttributes<HTMLButtonElement>).disabled}
      {...props}
    >
      {isLoading ? (
        <Loader2 className={cn(commonStyles.icon, themeStyles.icon, commonStyles.loadingIcon, themeStyles.loadingIcon)} size={20} />
      ) : (
        <>
          {Icon && <Icon className={cn(commonStyles.icon, themeStyles.icon)} size={20} />}
          <span className={cn(commonStyles.buttonText, themeStyles.buttonText)}>{children}</span>
        </>
      )}
    </Component>
  );
};

export default Button;
