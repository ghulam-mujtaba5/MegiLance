// @AI-HINT: Accessible Skip Link to jump to the main content. Appears when focused.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import commonStyles from './SkipLink.common.module.css';
import lightStyles from './SkipLink.light.module.css';
import darkStyles from './SkipLink.dark.module.css';

interface SkipLinkProps {
  href?: string; // default '#main-content'
  label?: string; // default 'Skip to main content'
}

const SkipLink: React.FC<SkipLinkProps> = ({ href = '#main-content', label = 'Skip to main content' }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => (theme === 'dark' ? { ...commonStyles, ...darkStyles } : { ...commonStyles, ...lightStyles }), [theme]);
  return (
    <a className={styles.skipLink} href={href}>{label}</a>
  );
};

export default SkipLink;
