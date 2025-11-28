// @AI-HINT: This is the Sidebar component. It provides the main navigation for the application dashboard. It is designed to be responsive, themed, and accessible, with a collapsible state, using a per-component CSS module architecture.
'use client';

import React, { useState, useId, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import SidebarNav from '../SidebarNav/SidebarNav';
import { MegiLanceLogo } from '../MegiLanceLogo/MegiLanceLogo';
import UserAvatar from '../UserAvatar/UserAvatar';

// AI-HINT: Import all necessary CSS modules. The theme-specific ones are passed as props to child components.
import commonStyles from './Sidebar.common.module.css';
import lightStyles from './Sidebar.light.module.css';
import darkStyles from './Sidebar.dark.module.css';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  userType?: 'admin' | 'client' | 'freelancer';
}

// AI-HINT: Role-aware navigation is provided by the shared SidebarNav component.

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar, userType }) => {
  const { resolvedTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const uniqueId = useId();
  const sidebarId = `${uniqueId}-sidebar`;
  const navId = `${uniqueId}-nav`;

  // Handle keyboard shortcut for toggling sidebar
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === '[' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      toggleSidebar();
    }
  }, [toggleSidebar]);

  if (!resolvedTheme) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <aside
      id={sidebarId}
      className={cn(
        commonStyles.sidebar,
        themeStyles.sidebar,
        isCollapsed ? commonStyles.sidebarCollapsed : commonStyles.sidebarExpanded
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      aria-label={`Main navigation sidebar${isCollapsed ? ' (collapsed)' : ''}`}
    >
      <header className={cn(commonStyles.sidebarHeader, themeStyles.sidebarHeader)}>
        <div className={cn(commonStyles.logoContainer)}>
          <MegiLanceLogo className={cn(commonStyles.logoIcon, isHovered && commonStyles.logoIconHovered)} />
          <span
            className={cn(
              commonStyles.logoText,
              themeStyles.logoText,
              isCollapsed && commonStyles.logoTextCollapsed
            )}
            aria-hidden={isCollapsed}
          >
            MegiLance
          </span>
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(commonStyles.toggleButton, themeStyles.toggleButton)}
          title={isCollapsed ? 'Expand Sidebar (Ctrl+[)' : 'Collapse Sidebar (Ctrl+[)'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
          aria-controls={navId}
        >
          {isCollapsed ? <ChevronRight size={20} aria-hidden="true" /> : <ChevronLeft size={20} aria-hidden="true" />}
        </button>
      </header>

      <nav id={navId} className={cn(commonStyles.sidebarNavContainer, themeStyles.sidebarNavContainer)} role="navigation">
        <SidebarNav isCollapsed={isCollapsed} userType={userType} />
      </nav>

      <div className={commonStyles.divider} role="separator" aria-hidden="true"></div>

      <footer className={cn(commonStyles.sidebarFooter, themeStyles.sidebarFooter)}>
        <div className={cn(commonStyles.userInfo)}>
          <UserAvatar src="/mock-avatar.svg" name="John Doe" size="large" className={commonStyles.avatar} />
          <div
            className={cn(
              commonStyles.userDetails,
              isCollapsed && commonStyles.userDetailsCollapsed
            )}
            aria-hidden={isCollapsed}
          >
            <span className={cn(commonStyles.userName, themeStyles.userName)}>John Doe</span>
            <span className={cn(commonStyles.userRole, themeStyles.userRole)}>
              {userType ? userType.charAt(0).toUpperCase() + userType.slice(1) : 'User'}
            </span>
          </div>
        </div>
      </footer>
    </aside>
  );
};

export default Sidebar;