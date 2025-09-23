// @AI-HINT: This is a reusable Checkbox component. It is designed to be themeable and accessible.
'use client';
import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import commonStyles from './Checkbox.common.module.css';
import lightStyles from './Checkbox.light.module.css';
import darkStyles from './Checkbox.dark.module.css';

export interface CheckboxProps {
  id?: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
  error?: string;
  className?: string;
  disabled?: boolean;
  indeterminate?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({ 
  id, 
  name, 
  checked, 
  onChange, 
  children, 
  error, 
  className = '',
  disabled = false,
  indeterminate = false
}) => {
  const { theme } = useTheme();
  
  if (!theme) {
    return null; // Don't render until theme is resolved
  }
  
  const themeStyles = theme === 'light' ? lightStyles : darkStyles;
  
  return (
    <div className={cn(commonStyles.checkboxWrapper, themeStyles.checkboxWrapper, className)}>
      <label className={cn(commonStyles.checkboxLabel, themeStyles.checkboxLabel)}>
        <input
          id={id}
          type="checkbox"
          name={name}
          className={cn(commonStyles.checkboxInput, themeStyles.checkboxInput)}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span className={cn(
          commonStyles.checkboxCustom, 
          themeStyles.checkboxCustom,
          indeterminate && commonStyles.indeterminate
        )}></span>
        <span className={cn(commonStyles.checkboxText, themeStyles.checkboxText)}>{children}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className={cn(commonStyles.checkboxError, themeStyles.checkboxError)}>
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
};

export default Checkbox;