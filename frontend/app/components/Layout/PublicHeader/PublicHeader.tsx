// @AI-HINT: This is the dedicated header for the public-facing marketing website. It includes navigation, branding, and primary calls-to-action like 'Sign In' and 'Sign Up'.
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import { MegiLanceLogo } from '@/app/components/MegiLanceLogo/MegiLanceLogo';
import Button from '@/app/components/Button/Button';

import commonStyles from './PublicHeader.common.module.css';
import lightStyles from './PublicHeader.light.module.css';
import darkStyles from './PublicHeader.dark.module.css';

const navLinks = [
  { name: 'Features', href: '/#features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contact', href: '/contact' },
];

const PublicHeader = () => {
  const { theme } = useTheme();
  const styles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <header className={cn(commonStyles.header, styles.header)}>
      <div className={cn(commonStyles.container, styles.container)}>
        <div className={commonStyles.logoContainer}>
          <Link href="/" aria-label="MegiLance Home">
            <MegiLanceLogo />
          </Link>
        </div>
        <nav className={commonStyles.nav}>
          <ul className={commonStyles.navList}>
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link href={link.href} className={cn(commonStyles.navLink, styles.navLink)}>
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={commonStyles.actionsContainer}>
          <Button as="a" href="/login" variant="ghost" className={cn(commonStyles.signInButton, styles.signInButton)}>
            Sign In
          </Button>
          <Button as="a" href="/signup" variant="primary">
            Sign Up Free
          </Button>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
