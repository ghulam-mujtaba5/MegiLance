// @AI-HINT: Lightweight CSS-based animated globe decoration for the PublicFooter. Shows on all public pages.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import commonStyles from './FooterGlobe.common.module.css';
import lightStyles from './FooterGlobe.light.module.css';
import darkStyles from './FooterGlobe.dark.module.css';

const FooterGlobe: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.globeWrapper, styles.globeWrapper)} aria-hidden="true">
      <div className={cn(commonStyles.globe, styles.globe)}>
        {/* Connection lines radiating outward */}
        <div className={cn(commonStyles.connection, commonStyles.conn1, styles.connection)} />
        <div className={cn(commonStyles.connection, commonStyles.conn2, styles.connection)} />
        <div className={cn(commonStyles.connection, commonStyles.conn3, styles.connection)} />
        <div className={cn(commonStyles.connection, commonStyles.conn4, styles.connection)} />
        <div className={cn(commonStyles.connection, commonStyles.conn5, styles.connection)} />

        {/* Orbiting rings */}
        <div className={cn(commonStyles.orbit, commonStyles.orbit1, styles.orbit)}>
          <div className={cn(commonStyles.dot, styles.dot)} />
        </div>
        <div className={cn(commonStyles.orbit, commonStyles.orbit2, styles.orbit)}>
          <div className={cn(commonStyles.dot, styles.dot)} />
        </div>

        {/* Center pulse glow */}
        <div className={cn(commonStyles.pulse, styles.pulse)} />
      </div>
    </div>
  );
};

export default FooterGlobe;
