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

  const style: React.CSSProperties = {
    width: width ?? (inline ? undefined : '100%'),
    height,
    borderRadius: typeof radius === 'number' ? `${radius}px` : radius,
  };

  const items = Array.from({ length: Math.max(1, lines) });

  // AI-HINT: Inline style is intentionally limited to sizing tokens (width/height/radius)
  // to keep the shimmer animation performant in CSS. Visual tokens remain in CSS modules.
  // If preferred, pass fixed sizes via className and theme files instead.
  return (
    <div className={clsx(styles.container, themeClass, inline && styles.inline, className)} aria-hidden>
      {items.map((_, i) => (
        // eslint-disable-next-line react/forbid-dom-props
        <div key={i} className={styles.block} style={style} />
      ))}
    </div>
  );
}
