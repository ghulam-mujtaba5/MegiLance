// @AI-HINT: This is a versatile, enterprise-grade Input component. It supports labels, icons, validation states (error), and is fully themed. All styles are per-component only. See Input.common.module.css, Input.light.module.css, and Input.dark.module.css for theming.

'use client';

import React, { useId } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './Input.common.module.css';
import lightStyles from './Input.light.module.css';
import darkStyles from './Input.dark.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hideLabel?: boolean;
  iconBefore?: React.ReactNode;
  iconAfter?: React.ReactNode;
  error?: string | boolean;
  helpText?: string;
  wrapperClassName?: string;
  fullWidth?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  iconBefore,
  iconAfter,
  error,
  helpText,
  className = '',
  wrapperClassName = '',
  fullWidth = false,
  ...props
}) => {
  const id = useId();
  const { theme } = useTheme();
  
  if (!theme) {
    return null; // Don't render until theme is resolved
  }
  
  const themeStyles = theme === 'light' ? lightStyles : darkStyles;
  const hasError = !!error;
  const errorId = hasError ? `${id}-error` : undefined;
  const helpId = !hasError && helpText ? `${id}-help` : undefined;

  return (
    <div
      className={cn(
        commonStyles.inputWrapper,
        themeStyles.inputWrapper,
        hasError && commonStyles.inputWrapperError,
        hasError && themeStyles.inputWrapperError,
        props.disabled && commonStyles.inputWrapperDisabled,
        props.disabled && themeStyles.inputWrapperDisabled,
        wrapperClassName,
        fullWidth && commonStyles.inputWrapperFullWidth,
        fullWidth && themeStyles.inputWrapperFullWidth
      )}
    >
      {label && <label htmlFor={id} className={cn(commonStyles.inputLabel, themeStyles.inputLabel)}>{label}</label>}
      <div className={cn(commonStyles.inputContainer, themeStyles.inputContainer)}>
        {iconBefore && <span className={cn(commonStyles.inputIcon, themeStyles.inputIcon, commonStyles.inputIconBefore, themeStyles.inputIconBefore)}>{iconBefore}</span>}
        <input
          id={id}
          className={cn(
            commonStyles.inputField,
            themeStyles.inputField,
            iconBefore && commonStyles.inputFieldWithIconBefore,
            iconBefore && themeStyles.inputFieldWithIconBefore,
            iconAfter && commonStyles.inputFieldWithIconAfter,
            iconAfter && themeStyles.inputFieldWithIconAfter,
            className
          )}
          aria-invalid={hasError ? 'true' : undefined}
          aria-describedby={errorId ?? helpId}
          aria-errormessage={errorId}
          {...props}
        />
        {iconAfter && <span className={cn(commonStyles.inputIcon, themeStyles.inputIcon, commonStyles.inputIconAfter, themeStyles.inputIconAfter)}>{iconAfter}</span>}
      </div>
      {hasError && typeof error === 'string' && (
        <p id={errorId} className={cn(commonStyles.errorMessage, themeStyles.errorMessage)}>{error}</p>
      )}
      {!hasError && helpText && (
        <p id={helpId} className={cn(commonStyles.helpText, themeStyles.helpText)}>{helpText}</p>
      )}
    </div>
  );
};

export default Input;
