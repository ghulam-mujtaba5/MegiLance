// @AI-HINT: This component builds the sidebar navigation for the freelancer portal, providing clear and accessible links to all major sections.
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { FaTachometerAlt, FaBriefcase, FaFileContract, FaWallet, FaChartLine, FaUser, FaCog, FaPaperPlane } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import MegiLanceLogo from '@/app/components/MegiLanceLogo/MegiLanceLogo';
import commonStyles from './FreelancerSidebarNav.common.module.css';
import lightStyles from './FreelancerSidebarNav.light.module.css';
import darkStyles from './FreelancerSidebarNav.dark.module.css';

const navItems = [
  { href: '/freelancer/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
  { href: '/freelancer/my-jobs', label: 'My Jobs', icon: FaBriefcase },
  { href: '/freelancer/proposals', label: 'Proposals', icon: FaPaperPlane },
  { href: '/freelancer/contracts', label: 'Contracts', icon: FaFileContract },
  { href: '/freelancer/wallet', label: 'Wallet', icon: FaWallet },
  { href: '/freelancer/analytics', label: 'Analytics', icon: FaChartLine },
  { href: '/freelancer/profile', label: 'Profile', icon: FaUser },
  { href: '/freelancer/settings', label: 'Settings', icon: FaCog },
];

const FreelancerSidebarNav = () => {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  return (
    <div className={styles.sidebarContainer}>
      <div className={styles.logoContainer}>
        <MegiLanceLogo />
      </div>
      <nav className={styles.navContainer}>
        <ul>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link href={item.href} className={cn(styles.navLink, isActive && styles.activeLink)}>
                  <Icon className={styles.navIcon} />
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default FreelancerSidebarNav;
