// @AI-HINT: This is the global Header component. It provides consistent navigation across the entire application and is fully theme-aware and responsive.
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Menu, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MegiLanceLogo } from '@/app/components/MegiLanceLogo/MegiLanceLogo';
import { Button } from '@/app/components/Button/Button';

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
              Explore
            </Link>
            <Link href="/how-it-works" className={cn(commonStyles.navLink, themeStyles.navLink)}>How It Works</Link>
            <Link href="/pricing" className={cn(commonStyles.navLink, themeStyles.navLink)}>Pricing</Link>
            <Link href="/about" className={cn(commonStyles.navLink, themeStyles.navLink)}>About</Link>
            <Link href="/blog" className={cn(commonStyles.navLink, themeStyles.navLink)}>Blog</Link>
            <Link href="/contact" className={cn(commonStyles.navLink, themeStyles.navLink)}>Contact</Link>
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
          Explore All Features
        </Link>
        <Link href="/how-it-works" className={cn(commonStyles.navLink, themeStyles.navLink)}>How It Works</Link>
        <Link href="/pricing" className={cn(commonStyles.navLink, themeStyles.navLink)}>Pricing</Link>
        <Link href="/about" className={cn(commonStyles.navLink, themeStyles.navLink)}>About</Link>
        <Link href="/blog" className={cn(commonStyles.navLink, themeStyles.navLink)}>Blog</Link>
        <Link href="/contact" className={cn(commonStyles.navLink, themeStyles.navLink)}>Contact</Link>
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
