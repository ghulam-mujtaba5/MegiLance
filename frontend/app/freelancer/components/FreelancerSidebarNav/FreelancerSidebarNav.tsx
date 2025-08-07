// @AI-HINT: This component builds the sidebar navigation for the freelancer portal, providing clear and accessible links to all major sections.
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './FreelancerSidebarNav.common.module.css';
import lightStyles from './FreelancerSidebarNav.light.module.css';
import darkStyles from './FreelancerSidebarNav.dark.module.css';

const navItems = [
  { href: '/freelancer/dashboard', label: 'Dashboard' },
  { href: '/freelancer/my-jobs', label: 'My Jobs' },
  { href: '/freelancer/projects', label: 'Projects' },
  { href: '/freelancer/contracts', label: 'Contracts' },
  { href: '/freelancer/wallet', label: 'Wallet' },
  { href: '/freelancer/analytics', label: 'Analytics' },
  { href: '/freelancer/profile', label: 'Profile' },
  { href: '/freelancer/settings', label: 'Settings' },
];

const FreelancerSidebarNav = () => {
  const pathname = usePathname();
  const { theme } = useTheme();

  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  return (
    <nav className={styles.nav}>
      <ul>
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(styles.navLink, { [styles.active]: pathname.startsWith(item.href) })}
              aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default FreelancerSidebarNav;
