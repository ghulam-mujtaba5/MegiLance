// @AI-HINT: This is a versatile, enterprise-grade Input component. It supports labels, icons, validation states (error), and is fully themed. All styles are per-component only.

'use client';

import React, { useId, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
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
  floatingLabel?: boolean;
  showPasswordToggle?: boolean;
  passwordStrength?: 'weak' | 'medium' | 'strong';
}

const Input: React.FC<InputProps> = ({
  label,
  hideLabel,
  iconBefore,
  iconAfter,
  error,
  helpText,
  className = '',
  wrapperClassName = '',
  fullWidth = false,
  floatingLabel = false,
  showPasswordToggle = false,
  passwordStrength,
  type = 'text',
  ...props
}) => {
  const id = useId();
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  if (!theme) {
    return null; // Don't render until theme is resolved
  }
  
  const themeStyles = theme === 'light' ? lightStyles : darkStyles;
  const hasError = !!error;
  const errorId = hasError ? `${id}-error` : undefined;
  const helpId = !hasError && helpText ? `${id}-help` : undefined;
  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Handle password toggle
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Determine if we should show the floating label effect
  const showFloatingLabel = floatingLabel && (isFocused || props.value || props.placeholder);

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
        fullWidth && themeStyles.inputWrapperFullWidth,
        floatingLabel && commonStyles.inputWrapperFloating,
        isFocused && commonStyles.inputWrapperFocused
      )}
    >
      {label && !hideLabel && (
        <label 
          htmlFor={id} 
          className={cn(
            commonStyles.inputLabel, 
            themeStyles.inputLabel,
            showFloatingLabel && commonStyles.floatingLabel
          )}
        >
          {label}
        </label>
      )}
      <div className={cn(commonStyles.inputContainer, themeStyles.inputContainer)}>
        {iconBefore && (
          <span className={cn(
            commonStyles.inputIcon, 
            themeStyles.inputIcon, 
            commonStyles.inputIconBefore, 
            themeStyles.inputIconBefore
          )}>
            {iconBefore}
          </span>
        )}
        <input
          id={id}
          type={inputType}
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
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            className={cn(
              commonStyles.inputIcon,
              themeStyles.inputIcon,
              commonStyles.inputIconAfter,
              themeStyles.inputIconAfter
            )}
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
        {iconAfter && !(showPasswordToggle && type === 'password') && (
          <span className={cn(
            commonStyles.inputIcon, 
            themeStyles.inputIcon, 
            commonStyles.inputIconAfter, 
            themeStyles.inputIconAfter
          )}>
            {iconAfter}
          </span>
        )}
      </div>
      {hasError && typeof error === 'string' && (
        <p id={errorId} className={cn(commonStyles.errorMessage, themeStyles.errorMessage)}>
          <AlertCircle size={16} />
          {error}
        </p>
      )}
      {!hasError && helpText && (
        <p id={helpId} className={cn(commonStyles.helpText, themeStyles.helpText)}>
          {helpText}
        </p>
      )}
      {passwordStrength && (
        <div className={cn(commonStyles.passwordStrength, themeStyles.passwordStrength, commonStyles[passwordStrength])}></div>
      )}
    </div>
  );
};

export default Input;