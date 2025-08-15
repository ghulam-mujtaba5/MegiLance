// @AI-HINT: This is a professional, responsive, and fully-themed navigation sidebar. It includes a logo, navigation links with icons, and a user profile section, adhering to brand guidelines. All styles are per-component only.

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { adminNavItems, clientNavItems, freelancerNavItems, NavItem as ConfigNavItem } from '@/app/config/navigation';
import baseStyles from './SidebarNav.base.module.css';
import lightStyles from './SidebarNav.light.module.css';
import darkStyles from './SidebarNav.dark.module.css';
import {
  LayoutDashboard,
  MessageSquare,
  FolderGit2,
  Wallet,
  HelpCircle,
  Settings as SettingsIcon,
  Users,
  CreditCard,
  LineChart,
  ShieldAlert,
  Briefcase,
  Calendar as CalendarIcon,
  LifeBuoy,
  Robot,
  FileText,
  User,
  Bell,
  Star,
  Calculator,
  Rocket,
} from 'lucide-react';

// AI-HINT: This map resolves string icon identifiers from the central navigation config to actual React components.
const iconMap: { [key: string]: React.ReactNode } = {
  FaTachometerAlt: <LayoutDashboard size={18} />,
  FaUsers: <Users size={18} />,
  FaBriefcase: <Briefcase size={18} />,
  FaCreditCard: <CreditCard size={18} />,
  FaRobot: <Robot size={18} />,
  FaLifeRing: <LifeBuoy size={18} />,
  FaCogs: <SettingsIcon size={18} />,
  FaShieldAlt: <ShieldAlert size={18} />,
  FaComments: <MessageSquare size={18} />,
  FaFileContract: <FileText size={18} />,
  FaPortrait: <User size={18} />,
  FaChartLine: <LineChart size={18} />,
  FaWallet: <Wallet size={18} />,
  FaBell: <Bell size={18} />,
  FaStar: <Star size={18} />,
  FaCalculator: <Calculator size={18} />,
  FaRocket: <Rocket size={18} />,
};


// Define the structure for a navigation item
export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

// Define the props for the SidebarNav component
export interface SidebarNavProps {
  userType?: 'admin' | 'client' | 'freelancer';
  theme?: string;
  isCollapsed?: boolean;
  className?: string;
}

const SidebarNav: React.FC<SidebarNavProps> = ({
  userType,
  theme: _externalTheme,
  isCollapsed = false,
  className = '',
}) => {
  const pathname = usePathname();
  const { theme } = useTheme(); // Use hook for theme

  // Theme styles selector (avoid conditional hooks)
  const themeStyles = useMemo(() => (theme === 'dark' ? darkStyles : lightStyles), [theme]);

  const computedNavItems: NavItem[] = useMemo(() => {
    let sourceItems: ConfigNavItem[] = [];
    switch (userType) {
      case 'admin':
        sourceItems = adminNavItems;
        break;
      case 'client':
        sourceItems = clientNavItems;
        break;
      case 'freelancer':
        sourceItems = freelancerNavItems;
        break;
      default:
        return [];
    }
    return sourceItems.map(item => ({
      href: item.href,
      label: item.label,
      icon: item.icon ? iconMap[item.icon] : <FolderGit2 size={18} />, // Default icon
    }));
  }, [userType]);

  const sidebarClasses = cn(
    baseStyles.sidebarNav,
    themeStyles.sidebarNav,
    `theme-${theme}`,
    isCollapsed && cn(baseStyles.sidebarNavCollapsed, themeStyles.sidebarNavCollapsed),
    className
  );

  return (
    <aside className={sidebarClasses}>
      <div className={cn(baseStyles.sidebarNavHeader, themeStyles.sidebarNavHeader)}>
        <div className={cn(baseStyles.sidebarNavLogo, themeStyles.sidebarNavLogo)}>
          {isCollapsed ? 'M' : 'MegiLance'}
        </div>
      </div>
      <nav className={cn(baseStyles.sidebarNavNav, themeStyles.sidebarNavNav)}>
        <ul className={cn(baseStyles.sidebarNavList, themeStyles.sidebarNavList)}>
          {computedNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href} className={cn(baseStyles.sidebarNavItem, themeStyles.sidebarNavItem)}>
                <Link
                  href={item.href}
                  className={cn(
                    baseStyles.sidebarNavLink,
                    themeStyles.sidebarNavLink,
                    isActive && cn(baseStyles.sidebarNavLinkActive, themeStyles.sidebarNavLinkActive)
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  title={item.label}
                  data-testid={`sidebar-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <span className={cn(baseStyles.sidebarNavIcon, themeStyles.sidebarNavIcon)} aria-hidden>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className={cn(baseStyles.sidebarNavLabel, themeStyles.sidebarNavLabel)}>{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className={cn(baseStyles.sidebarNavFooter, themeStyles.sidebarNavFooter)}>
        {/* Placeholder for future UserAvatar or ProfileMenu component */}
      </div>
    </aside>
  );
};

export default SidebarNav;
