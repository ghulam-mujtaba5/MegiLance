// @AI-HINT: This is a versatile, enterprise-grade Textarea component. It mirrors the Input component's features, supporting labels, validation states, and full theming for a consistent user experience across all forms.

'use client';

import React, { useId, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

import commonStyles from './Textarea.common.module.css';
import lightStyles from './Textarea.light.module.css';
import darkStyles from './Textarea.dark.module.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hideLabel?: boolean;
  error?: string | boolean;
  helpText?: string;
  wrapperClassName?: string;
  fullWidth?: boolean;
  floatingLabel?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  hideLabel,
  error,
  helpText,
  className = '',
  wrapperClassName = '',
  fullWidth = false,
  floatingLabel = false,
  maxLength,
  showCharacterCount = false,
  ...props
}) => {
  const id = useId();
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [charCount, setCharCount] = useState(props.value?.toString().length || 0);

  if (!theme) {
    return null; // Don't render until theme is resolved
  }

  const themeStyles = theme === 'light' ? lightStyles : darkStyles;
  const hasError = !!error;
  const errorId = hasError ? `${id}-error` : undefined;
  const helpId = !hasError && helpText ? `${id}-help` : undefined;
  
  // Calculate character count and warning states
  const currentLength = charCount;
  const isNearLimit = maxLength && currentLength >= maxLength * 0.8;
  const isOverLimit = maxLength && currentLength > maxLength;

  // Handle text change for character counting
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCharCount(value.length);
    props.onChange?.(e);
  };

  // Determine if we should show the floating label effect
  const showFloatingLabel = floatingLabel && (isFocused || props.value || props.placeholder);

  return (
    <div
      className={cn(
        commonStyles.textareaWrapper,
        themeStyles.textareaWrapper,
        hasError && commonStyles.textareaWrapperError,
        hasError && themeStyles.textareaWrapperError,
        props.disabled && commonStyles.textareaWrapperDisabled,
        props.disabled && themeStyles.textareaWrapperDisabled,
        wrapperClassName,
        fullWidth && commonStyles.textareaWrapperFullWidth,
        fullWidth && themeStyles.textareaWrapperFullWidth,
        floatingLabel && commonStyles.textareaWrapperFloating,
        isFocused && commonStyles.textareaWrapperFocused
      )}
    >
      {label && !hideLabel && (
        <label 
          htmlFor={id} 
          className={cn(
            commonStyles.textareaLabel, 
            themeStyles.textareaLabel,
            showFloatingLabel && commonStyles.floatingLabel
          )}
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          commonStyles.textareaField,
          themeStyles.textareaField,
          className
        )}
        aria-invalid={hasError ? 'true' : undefined}
        aria-describedby={errorId ?? helpId}
        aria-errormessage={errorId}
        maxLength={maxLength}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        onChange={handleChange}
        {...props}
      />
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
      {showCharacterCount && maxLength && (
        <div 
          className={cn(
            commonStyles.characterCounter, 
            themeStyles.characterCounter,
            isOverLimit && commonStyles.error,
            isNearLimit && !isOverLimit && commonStyles.warning
          )}
        >
          {currentLength}/{maxLength}
        </div>
      )}
    </div>
  );
};

export default Textarea;