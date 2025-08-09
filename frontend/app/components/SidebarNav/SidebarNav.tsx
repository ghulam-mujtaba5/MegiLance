// @AI-HINT: This is a professional, responsive, and fully-themed navigation sidebar. It includes a logo, navigation links with icons, and a user profile section, adhering to brand guidelines. All styles are per-component only.

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import styles from './SidebarNav.common.module.css';

// Define the structure for a navigation item
export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

// Define the props for the SidebarNav component
export interface SidebarNavProps {
  navItems?: NavItem[];
  userType?: 'admin' | 'client' | 'freelancer';
  // Accept external theme prop for compatibility with legacy callers; internal theming still uses next-themes.
  theme?: string;
  isCollapsed?: boolean;
  className?: string;
}

const SidebarNav: React.FC<SidebarNavProps> = ({
  navItems,
  userType,
  theme: _externalTheme,
  isCollapsed = false,
  className = '',
}) => {
  const pathname = usePathname();
  const { theme } = useTheme(); // Use hook for theme

  // Provide sensible defaults when navItems are not passed in, based on userType
  const computedNavItems: NavItem[] = navItems && navItems.length > 0
    ? navItems
    : ((): NavItem[] => {
        switch (userType) {
          case 'admin':
            return [
              { href: '/admin/dashboard', label: 'Dashboard', icon: null },
              { href: '/admin/users', label: 'Users', icon: null },
              { href: '/admin/projects', label: 'Projects', icon: null },
              { href: '/admin/payments', label: 'Payments', icon: null },
              { href: '/admin/support', label: 'Support', icon: null },
              { href: '/admin/ai-monitoring', label: 'AI Monitoring', icon: null },
              { href: '/admin/settings', label: 'Settings', icon: null },
            ];
          case 'client':
            return [
              { href: '/dashboard', label: 'Dashboard', icon: null },
              { href: '/messages', label: 'Messages', icon: null },
              { href: '/client/projects', label: 'Projects', icon: null },
              { href: '/client/payments', label: 'Payments', icon: null },
              { href: '/help', label: 'Help', icon: null },
              { href: '/settings', label: 'Settings', icon: null },
            ];
          case 'freelancer':
            return [
              { href: '/dashboard', label: 'Dashboard', icon: null },
              { href: '/messages', label: 'Messages', icon: null },
              { href: '/freelancer/projects', label: 'Projects', icon: null },
              { href: '/freelancer/wallet', label: 'Wallet', icon: null },
              { href: '/help', label: 'Help', icon: null },
              { href: '/settings', label: 'Settings', icon: null },
            ];
          default:
            return [];
        }
      })();

  const sidebarClasses = cn(
    styles.sidebarNav,
    `theme-${theme}`, // Apply global theme class for CSS variables
    isCollapsed && styles.sidebarNavCollapsed,
    className
  );

  return (
    <aside className={sidebarClasses}>
      <div className={styles.sidebarNavHeader}>
        <div className={styles.sidebarNavLogo}>
          {isCollapsed ? 'M' : 'MegiLance'}
        </div>
      </div>
      <nav className={styles.sidebarNavNav}>
        <ul className={styles.sidebarNavList}>
          {computedNavItems.map((item) => (
            <li key={item.href} className={styles.sidebarNavItem}>
              <Link
                href={item.href}
                className={cn(
                  styles.sidebarNavLink,
                  pathname === item.href && styles.sidebarNavLinkActive
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <span className={styles.sidebarNavIcon}>{item.icon}</span>
                {!isCollapsed && <span className={styles.sidebarNavLabel}>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className={styles.sidebarNavFooter}>
        {/* Placeholder for future UserAvatar or ProfileMenu component */}
      </div>
    </aside>
  );
};

export default SidebarNav;
