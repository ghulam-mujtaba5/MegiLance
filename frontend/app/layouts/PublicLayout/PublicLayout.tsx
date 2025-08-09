/* @AI-HINT: PublicLayout provides the shared chrome (Header, Footer, skip links) for all public-facing pages. It is theme-aware and uses per-component CSS modules (common, light, dark). */
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './PublicLayout.common.module.css';
import lightStyles from './PublicLayout.light.module.css';
import darkStyles from './PublicLayout.dark.module.css';

type Props = { children: React.ReactNode };

const PublicLayout: React.FC<Props> = ({ children }) => {
  const { theme } = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  const styles = React.useMemo(() => ({
    root: cn(commonStyles.root, themeStyles.root),
    skipLink: cn(commonStyles.skipLink, themeStyles.skipLink),
    header: cn(commonStyles.header, themeStyles.header),
    nav: cn(commonStyles.nav, themeStyles.nav),
    navBrand: cn(commonStyles.navBrand, themeStyles.navBrand),
    navPrimary: cn(commonStyles.navPrimary, themeStyles.navPrimary),
    spacer: commonStyles.spacer,
    navLink: cn(commonStyles.navLink, themeStyles.navLink),
    navLinkActive: cn(commonStyles.navLinkActive, themeStyles.navLinkActive),
    mobileToggle: cn(commonStyles.mobileToggle, themeStyles.mobileToggle),
    mobileNav: cn(commonStyles.mobileNav, themeStyles.mobileNav, mobileOpen && commonStyles.mobileNavOpen, mobileOpen && themeStyles.mobileNavOpen),
    srOnly: commonStyles.srOnly,
    main: cn(commonStyles.main, themeStyles.main),
    footer: cn(commonStyles.footer, themeStyles.footer),
    footerMeta: cn(commonStyles.footerMeta, themeStyles.footerMeta),
  }), [theme, mobileOpen]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <div className={styles.root}>
      <a href="#main" className={styles.skipLink}>Skip to content</a>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Main">
          <div className={styles.navBrand}>
            <Link className={styles.navLink} href="/" aria-label="MegiLance Home">MegiLance</Link>
          </div>
          <button
            className={styles.mobileToggle}
            aria-controls="primary-navigation"
            aria-expanded={mobileOpen ? 'true' : 'false'}
            onClick={() => setMobileOpen(o => !o)}
          >
            <span aria-hidden="true">☰</span>
            <span className={styles.srOnly}>Menu</span>
          </button>
          <div id="primary-navigation" className={styles.navPrimary} role="navigation" aria-label="Primary">
            <Link className={cn(styles.navLink, isActive('/') && styles.navLinkActive)} aria-current={isActive('/') ? 'page' : undefined} href="/">Home</Link>
            <Link className={cn(styles.navLink, isActive('/pricing') && styles.navLinkActive)} aria-current={isActive('/pricing') ? 'page' : undefined} href="/pricing">Pricing</Link>
            <Link className={cn(styles.navLink, isActive('/about') && styles.navLinkActive)} aria-current={isActive('/about') ? 'page' : undefined} href="/about">About</Link>
            <Link className={cn(styles.navLink, isActive('/blog') && styles.navLinkActive)} aria-current={isActive('/blog') ? 'page' : undefined} href="/blog">Blog</Link>
            <Link className={cn(styles.navLink, isActive('/faq') && styles.navLinkActive)} aria-current={isActive('/faq') ? 'page' : undefined} href="/faq">FAQ</Link>
            <Link className={cn(styles.navLink, isActive('/contact') && styles.navLinkActive)} aria-current={isActive('/contact') ? 'page' : undefined} href="/contact">Contact</Link>
            <Link className={cn(styles.navLink, isActive('/clients') && styles.navLinkActive)} aria-current={isActive('/clients') ? 'page' : undefined} href="/clients">Clients</Link>
            <Link className={cn(styles.navLink, isActive('/freelancers') && styles.navLinkActive)} aria-current={isActive('/freelancers') ? 'page' : undefined} href="/freelancers">Freelancers</Link>
            <span className={styles.spacer} />
            <Link className={cn(styles.navLink, isActive('/login') && styles.navLinkActive)} href="/login">Log in</Link>
            <Link className={cn(styles.navLink, isActive('/signup') && styles.navLinkActive)} href="/signup">Sign up</Link>
          </div>
        </nav>
        <div className={styles.mobileNav}>
          <Link className={cn(styles.navLink, isActive('/') && styles.navLinkActive)} onClick={() => setMobileOpen(false)} href="/">Home</Link>
          <Link className={cn(styles.navLink, isActive('/pricing') && styles.navLinkActive)} onClick={() => setMobileOpen(false)} href="/pricing">Pricing</Link>
          <Link className={cn(styles.navLink, isActive('/about') && styles.navLinkActive)} onClick={() => setMobileOpen(false)} href="/about">About</Link>
          <Link className={cn(styles.navLink, isActive('/blog') && styles.navLinkActive)} onClick={() => setMobileOpen(false)} href="/blog">Blog</Link>
          <Link className={cn(styles.navLink, isActive('/faq') && styles.navLinkActive)} onClick={() => setMobileOpen(false)} href="/faq">FAQ</Link>
          <Link className={cn(styles.navLink, isActive('/contact') && styles.navLinkActive)} onClick={() => setMobileOpen(false)} href="/contact">Contact</Link>
          <Link className={cn(styles.navLink, isActive('/clients') && styles.navLinkActive)} onClick={() => setMobileOpen(false)} href="/clients">Clients</Link>
          <Link className={cn(styles.navLink, isActive('/freelancers') && styles.navLinkActive)} onClick={() => setMobileOpen(false)} href="/freelancers">Freelancers</Link>
          <Link className={cn(styles.navLink, isActive('/login') && styles.navLinkActive)} onClick={() => setMobileOpen(false)} href="/login">Log in</Link>
          <Link className={cn(styles.navLink, isActive('/signup') && styles.navLinkActive)} onClick={() => setMobileOpen(false)} href="/signup">Sign up</Link>
        </div>
      </header>
      <main id="main" className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>
        <div>© {new Date().getFullYear()} MegiLance</div>
        <div className={styles.footerMeta}>
          <Link className={styles.navLink} href="/legal/terms">Terms</Link>
          <Link className={styles.navLink} href="/legal/privacy">Privacy</Link>
          <Link className={styles.navLink} href="/security">Security</Link>
          <Link className={styles.navLink} href="/support">Support</Link>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
