// @AI-HINT: This component renders the primary sidebar navigation for the client portal, providing links to all key sections for managing projects and freelancers.
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { FaTachometerAlt, FaBriefcase, FaUsers, FaWallet, FaCog } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import MegiLanceLogo from '@/app/components/MegiLanceLogo/MegiLanceLogo';

import commonStyles from './ClientSidebarNav.common.module.css';
import lightStyles from './ClientSidebarNav.light.module.css';
import darkStyles from './ClientSidebarNav.dark.module.css';

const clientNavItems = [
  { href: '/client/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
  { href: '/client/projects', label: 'My Projects', icon: FaBriefcase },
  { href: '/client/freelancers', label: 'My Freelancers', icon: FaUsers },
  { href: '/client/payments', label: 'Payments', icon: FaWallet },
  { href: '/client/settings', label: 'Settings', icon: FaCog },
];

const ClientSidebarNav: React.FC = () => {
  const pathname = usePathname();
  const { theme } = useTheme();

  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  return (
    <div className={styles.sidebarContainer}>
      <div className={styles.logoContainer}>
        <MegiLanceLogo />
      </div>
      <nav className={styles.navContainer}>
        <ul>
          {clientNavItems.map((item) => {
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

export default ClientSidebarNav;
