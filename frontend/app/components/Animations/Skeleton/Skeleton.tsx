/* AI-HINT: Premium skeleton loader component. Per-component CSS (common/light/dark). Use to indicate loading areas beyond global loader. */
'use client';

import React from 'react';
import clsx from 'clsx';
import styles from './Skeleton.common.module.css';
import light from './Skeleton.light.module.css';
import dark from './Skeleton.dark.module.css';

export type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  lines?: number;
  inline?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
};

export default function Skeleton({ width, height = 14, radius = 8, lines = 1, inline = false, theme, className }: SkeletonProps) {
  const themeClass = theme === 'dark' ? dark.theme : theme === 'light' ? light.theme : '';

  const items = Array.from({ length: Math.max(1, lines) });

  return (
    <div className={clsx(styles.container, themeClass, inline && styles.inline, className)} aria-hidden>
      {items.map((_, i) => (
        <div 
          key={i} 
          className={styles.block} 
          data-width={typeof width === 'number' ? `${width}px` : width}
          data-height={typeof height === 'number' ? `${height}px` : height}
          data-radius={typeof radius === 'number' ? `${radius}px` : radius}
        />
      ))}
    </div>
  );
}
