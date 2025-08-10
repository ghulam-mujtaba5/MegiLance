/* AI-HINT: Premium page transition wrapper. Per-component CSS (common/light/dark). Animates route changes subtly and efficiently. */
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import styles from './PageTransition.common.module.css';
import light from './PageTransition.light.module.css';
import dark from './PageTransition.dark.module.css';

export type PageTransitionProps = {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
  variant?: 'fade' | 'slide' | 'scale';
};

export default function PageTransition({ children, theme, variant = 'fade' }: PageTransitionProps) {
  const pathname = usePathname();
  const themeClass = theme === 'dark' ? dark.theme : theme === 'light' ? light.theme : '';

  const wrapperRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    // Move keyboard focus to the new page content on navigation for accessibility
    wrapperRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div
      key={pathname}
      ref={wrapperRef}
      className={[styles.base, styles[variant], themeClass].join(' ')}
      role="region"
      aria-label="Page content"
      tabIndex={-1}
    >
      <div className={styles.stage}>{children}</div>
    </div>
  );
}
