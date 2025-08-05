// @AI-HINT: This component renders the navigation items within the Sidebar. It dynamically handles the collapsed state, showing full labels or just icons, and is styled using per-component CSS modules.
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// AI-HINT: We will dynamically import the light/dark modules in a parent component based on theme context.
import commonStyles from './SidebarNav.common.module.css';

// Define the structure for a navigation item
export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

// Define the props for the SidebarNav component
export interface SidebarNavProps {
  isCollapsed: boolean;
  navItems: NavItem[];
  // AI-HINT: theme styles are passed as props to allow dynamic theme switching.
  lightStyles: { [key: string]: string };
  darkStyles: { [key: string]: string };
  currentTheme: 'light' | 'dark';
}

const SidebarNav: React.FC<SidebarNavProps> = ({ 
  isCollapsed, 
  navItems, 
  lightStyles, 
  darkStyles, 
  currentTheme 
}) => {
  const pathname = usePathname();
  const themeStyles = currentTheme === 'light' ? lightStyles : darkStyles;

  return (
    <nav className={commonStyles.sidebarNav}>
      <ul className={commonStyles.navList}>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          const linkClasses = `
            ${commonStyles.navLink}
            ${isActive ? themeStyles.navLinkActive : themeStyles.navLinkInactive}
            ${isCollapsed ? commonStyles.navLinkCollapsed : ''}
          `;

          return (
            <li key={item.href} className={commonStyles.navItem}>
              <Link href={item.href} title={isCollapsed ? item.label : ''} className={linkClasses}>
                <Icon className={commonStyles.navIcon} />
                {!isCollapsed && <span className={commonStyles.navLabel}>{item.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default SidebarNav;

