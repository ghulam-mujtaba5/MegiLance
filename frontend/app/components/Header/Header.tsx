// @AI-HINT: This is the global Header component. It provides consistent navigation across the entire application and is fully theme-aware and responsive.
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Menu, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MegiLanceLogo } from '@/app/components/MegiLanceLogo/MegiLanceLogo';
import { Button } from '@/app/components/Button/Button';
import StatusIndicator from '@/app/components/StatusIndicator/StatusIndicator';

import commonStyles from './Header.common.module.css';
import lightStyles from './Header.light.module.css';
import darkStyles from './Header.dark.module.css';

const navLinks = [
  { name: 'How It Works', href: '/how-it-works' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'About', href: '/about' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contact', href: '/contact' },
];

const Header: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <>
      <header className={cn(commonStyles.header, themeStyles.header)}>
        <nav className={commonStyles.nav}>
          <Link href="/" className={commonStyles.brandLink}>
            <MegiLanceLogo />
            <span className={commonStyles.brandName}>MegiLance</span>
          </Link>
          <div className={commonStyles.navLinks}>
            <Link href="/explore" className={cn(commonStyles.exploreLink, themeStyles.exploreLink)}>
              <Sparkles size={16} />
              Explore <StatusIndicator status="working" />
            </Link>
            <Link href="/client/dashboard" className={cn(commonStyles.navLink, themeStyles.navLink)}>
              Client <StatusIndicator status="complete" />
            </Link>
            <Link href="/freelancer/dashboard" className={cn(commonStyles.navLink, themeStyles.navLink)}>
              Freelancer <StatusIndicator status="complete" />
            </Link>
            <Link href="/admin/dashboard" className={cn(commonStyles.navLink, themeStyles.navLink)}>
              Admin <StatusIndicator status="working" />
            </Link>
            <Link href="/login" className={commonStyles.signInLink}>
              <Button variant="primary" size="sm" className={commonStyles.signInButton}>
                Sign In
              </Button>
            </Link>
          </div>
          <button onClick={toggleMenu} className={cn(commonStyles.mobileMenuButton, themeStyles.mobileMenuButton)} aria-label="Toggle menu">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </header>
      <div className={cn(commonStyles.mobileNavMenu, themeStyles.mobileNavMenu, isMenuOpen && commonStyles.mobileNavMenuActive)}>
        <Link href="/explore" className={cn(commonStyles.exploreLink, themeStyles.exploreLink)} onClick={() => setIsMenuOpen(false)}>
          <Sparkles size={16} />
          Explore All Features <StatusIndicator status="working" />
        </Link>
        <Link href="/client/dashboard" className={cn(commonStyles.navLink, themeStyles.navLink)} onClick={() => setIsMenuOpen(false)}>
          Client Portal <StatusIndicator status="complete" />
        </Link>
        <Link href="/freelancer/dashboard" className={cn(commonStyles.navLink, themeStyles.navLink)} onClick={() => setIsMenuOpen(false)}>
          Freelancer Portal <StatusIndicator status="complete" />
        </Link>
        <Link href="/admin/dashboard" className={cn(commonStyles.navLink, themeStyles.navLink)} onClick={() => setIsMenuOpen(false)}>
          Admin Portal <StatusIndicator status="working" />
        </Link>
        <Link href="/login" className={commonStyles.signInLinkMobile}>
           <Button variant="primary" size="md" fullWidth>
              Sign In
           </Button>
        </Link>
      </div>
    </>
  );
};

export default Header;
