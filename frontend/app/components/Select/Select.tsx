// @AI-HINT: A reusable, theme-aware Select component for consistent form styling across the application.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import commonStyles from './Select.common.module.css';
import lightStyles from './Select.light.module.css';
import darkStyles from './Select.dark.module.css';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label?: string;
  options: SelectOption[];
  fullWidth?: boolean;
}

const Select: React.FC<SelectProps> = ({ id, label, options, fullWidth = false, className, ...props }) => {
  const { resolvedTheme } = useTheme();
  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  const containerClasses = [
    styles.container,
    fullWidth ? styles.fullWidth : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <div className={styles.selectWrapper}>
        <select id={id} className={styles.select} {...props}>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={styles.chevron}></span>
      </div>
    </div>
  );
};

export default Select;
