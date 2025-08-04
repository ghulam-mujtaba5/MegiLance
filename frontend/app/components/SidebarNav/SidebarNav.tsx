// @AI-HINT: This is a professional, responsive, and fully-themed navigation sidebar. It includes a logo, navigation links with icons, and a user profile section, adhering to brand guidelines. All styles are per-component only.

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './SidebarNav.common.css';
import './SidebarNav.light.css';
import './SidebarNav.dark.css';

// Define the structure for a navigation item
export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

// Define the props for the SidebarNav component
export interface SidebarNavProps {
  navItems: NavItem[];
  theme?: 'light' | 'dark';
  isCollapsed?: boolean;
  className?: string;
}

const SidebarNav: React.FC<SidebarNavProps> = ({
  navItems,
  theme = 'light',
  isCollapsed = false,
  className = '',
}) => {
  const pathname = usePathname();

  const sidebarClasses = [
    'SidebarNav',
    `SidebarNav--${theme}`,
    isCollapsed ? 'SidebarNav--collapsed' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <aside className={sidebarClasses}>
      <div className="SidebarNav-header">
        <div className="SidebarNav-logo">
          {isCollapsed ? 'M' : 'MegiLance'}
        </div>
      </div>
      <nav className="SidebarNav-nav">
        <ul className="SidebarNav-list">
          {navItems.map((item) => (
            <li key={item.href} className="SidebarNav-item">
              <Link
                href={item.href}
                className={`SidebarNav-link ${pathname === item.href ? 'SidebarNav-link--active' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="SidebarNav-icon">{item.icon}</span>
                {!isCollapsed && <span className="SidebarNav-label">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="SidebarNav-footer">
        {/* Placeholder for future UserAvatar or ProfileMenu component */}
      </div>
    </aside>
  );
};

export default SidebarNav;
