// @AI-HINT: This is a professional, responsive, and fully-themed navigation sidebar. It includes a logo, navigation links with icons, and a user profile section, adhering to brand guidelines. All styles are per-component only.

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import styles from './SidebarNav.common.module.css';
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
  Bell,
  ChevronDown,
  ChevronUp,
  Home,
  User,
  FileText,
  BarChart3,
  Calendar,
  Mail,
  Phone,
  Lock,
  Star,
  TrendingUp,
  Search,
  Gavel,
  Bot,
  Video,
  Wrench,
  History,
  Tag,
  List,
  Activity,
  Heart,
  Globe
} from 'lucide-react';
import {
  clientNavItems,
  freelancerNavItems,
  adminNavItems,
  NavItem as ConfigNavItem
} from '@/app/config/navigation';

// Map string icon names to React components
const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard size={18} />,
  MessageSquare: <MessageSquare size={18} />,
  Briefcase: <Briefcase size={18} />,
  FileText: <FileText size={18} />,
  CreditCard: <CreditCard size={18} />,
  Users: <Users size={18} />,
  Star: <Star size={18} />,
  Settings: <SettingsIcon size={18} />,
  HelpCircle: <HelpCircle size={18} />,
  Search: <Search size={18} />,
  ShieldAlert: <ShieldAlert size={18} />,
  Gavel: <Gavel size={18} />,
  Bot: <Bot size={18} />,
  LineChart: <LineChart size={18} />,
  Video: <Video size={18} />,
  Calendar: <Calendar size={18} />,
  Lock: <Lock size={18} />,
  Wallet: <Wallet size={18} />,
  TrendingUp: <TrendingUp size={18} />,
  User: <User size={18} />,
  Phone: <Phone size={18} />,
  BarChart3: <BarChart3 size={18} />,
  FolderGit2: <FolderGit2 size={18} />,
  Bell: <Bell size={18} />,
  Heart: <Heart size={18} />,
  Wrench: <Wrench size={18} />,
  History: <History size={18} />,
  Tag: <Tag size={18} />,
  List: <List size={18} />,
  Activity: <Activity size={18} />,
  Globe: <Globe size={18} />,
  Mail: <Mail size={18} />,
  Home: <Home size={18} />,
};

// Define the structure for a navigation item
export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode | string;
  badge?: string | number;
  submenu?: NavItem[];
  section?: string;
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
  const { resolvedTheme } = useTheme(); // Use hook for theme
  const [openSubmenus, setOpenSubmenus] = React.useState<Record<string, boolean>>({});

  // Helper to convert ConfigNavItem to local NavItem
  const mapConfigItems = (items: ConfigNavItem[]): NavItem[] => {
    return items.map(item => ({
      href: item.href,
      label: item.label,
      icon: item.icon && iconMap[item.icon] ? iconMap[item.icon] : <HelpCircle size={18} />,
      badge: item.badge,
      submenu: item.submenu ? mapConfigItems(item.submenu) : undefined,
      section: item.section,
    }));
  };

  // Provide sensible defaults when navItems are not passed in, based on userType
  const computedNavItems: NavItem[] = navItems && navItems.length > 0
    ? navItems
    : ((): NavItem[] => {
        switch (userType) {
          case 'admin':
            return mapConfigItems(adminNavItems);
          case 'client':
            return mapConfigItems(clientNavItems);
          case 'freelancer':
            return mapConfigItems(freelancerNavItems);
          default:
            return mapConfigItems(clientNavItems);
        }
      })();

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const toggleSubmenu = (href: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [href]: !prev[href]
    }));
  };

  const sidebarClasses = cn(
    styles.sidebarNav,
    `theme-${resolvedTheme}`, // Apply global theme class for CSS variables
    isCollapsed && styles.sidebarNavCollapsed,
    className
  );

  return (
    <aside className={sidebarClasses}>
      <nav className={styles.sidebarNavNav}>
        <ul className={styles.sidebarNavList}>
          {computedNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const isSubmenuOpen = openSubmenus[item.href];
            
            return (
              <React.Fragment key={item.href}>
                {item.section && !isCollapsed && (
                  <li className={styles.sidebarNavSectionHeader} aria-hidden="true">
                    <span className={cn(styles.sidebarNavSectionLabel, themeStyles.sectionLabel)}>{item.section}</span>
                  </li>
                )}
                {item.section && isCollapsed && (
                  <li className={cn(styles.sidebarNavSectionDivider, themeStyles.sidebarNavSectionDivider)} aria-hidden="true" />
                )}
                <li className={styles.sidebarNavItem}>
                  <Link
                    href={item.submenu ? '#' : item.href}
                    className={cn(
                      styles.sidebarNavLink,
                      themeStyles.navLinkInactive,
                      isActive && styles.sidebarNavLinkActive,
                      isActive && themeStyles.navLinkActive
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    title={isCollapsed ? undefined : item.label}
                    data-testid={`sidebar-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={(e) => {
                      if (item.submenu) {
                        e.preventDefault();
                        toggleSubmenu(item.href);
                      }
                    }}
                  >
                    <span className={cn(styles.sidebarNavIcon, isActive && styles.sidebarNavIconActive)} aria-hidden>
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <>
                        <span className={styles.sidebarNavLabel}>{item.label}</span>
                        {item.badge && (
                          <span className={cn(styles.badge, themeStyles.badge)}>{item.badge}</span>
                        )}
                        {item.submenu && (
                          <span className={cn(styles.sidebarNavIcon, styles.sidebarNavChevron)}>
                            {isSubmenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <span className={cn(styles.tooltip, themeStyles.tooltip)} role="tooltip">
                      {item.label}
                    </span>
                  )}
                </li>
                {item.submenu && !isCollapsed && isSubmenuOpen && (
                  <ul className={cn(styles.sidebarNavList, styles.sidebarNavListNested)}>
                    {item.submenu.map((subItem) => {
                      const isSubActive = pathname === subItem.href;
                      return (
                        <li key={subItem.href} className={cn(styles.sidebarNavItem, styles.sidebarNavSubItem)}>
                          <Link
                            href={subItem.href}
                            className={cn(
                              styles.sidebarNavLink,
                              themeStyles.navLinkInactive,
                              isSubActive && styles.sidebarNavLinkActive,
                              isSubActive && themeStyles.navLinkActive,
                              styles.sidebarNavSubLink,
                              themeStyles.sidebarNavSubLink
                            )}
                            aria-current={isSubActive ? 'page' : undefined}
                            title={subItem.label}
                          >
                            <span className={cn(styles.sidebarNavIcon, isSubActive && styles.sidebarNavIconActive)} aria-hidden>
                              {subItem.icon}
                            </span>
                            <span className={styles.sidebarNavLabel}>{subItem.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </React.Fragment>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default SidebarNav;