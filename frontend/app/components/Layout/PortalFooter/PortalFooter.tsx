// @AI-HINT: Dedicated footer for the portal area. Simple and clean.
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import commonStyles from './PortalFooter.common.module.css';
import lightStyles from './PortalFooter.light.module.css';
import darkStyles from './PortalFooter.dark.module.css';

const PortalFooter = () => {
  const { resolvedTheme } = useTheme();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <footer className={cn(commonStyles.footer, styles.footer)}>
      <div className={commonStyles.container}>
        <p className={cn(commonStyles.copyright, styles.copyright)}>
          &copy; {new Date().getFullYear()} MegiLance. All rights reserved.
        </p>
        <div className={commonStyles.links}>
          <Link href="/help" className={cn(commonStyles.link, styles.link)}>
            Help Center
          </Link>
          <Link href="/terms" className={cn(commonStyles.link, styles.link)}>
            Terms
          </Link>
          <Link href="/privacy" className={cn(commonStyles.link, styles.link)}>
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default PortalFooter;
