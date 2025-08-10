// @AI-HINT: This is the main AppLayout component that creates the shell for authenticated users, combining the Sidebar and Navbar for a cohesive application experience.
'use client';

import React, { useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Navbar from '../Navbar/Navbar';
import { useTheme } from 'next-themes';
import { User as UserIcon, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

import commonStyles from './AppLayout.common.module.css';
import lightStyles from './AppLayout.light.module.css';
import darkStyles from './AppLayout.dark.module.css';

// Mock data for Navbar, providing a realistic user experience for demonstration.
const profileMenuItems = [
  { label: 'Your Profile', href: '/profile', icon: <UserIcon size={16} /> },
  { label: 'Settings', href: '/settings', icon: <Settings size={16} /> },
  { label: 'Sign out', href: '/logout', icon: <LogOut size={16} /> },
];

const user = {
  fullName: 'John Doe',
  email: 'john.doe@megilance.com',
  bio: 'Investor & Entrepreneur',
  avatar: '/mock-avatar.svg',
  notificationCount: 3,
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme } = useTheme();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (!theme) return null; // Avoid rendering until theme is loaded to prevent flash of unstyled content

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.appLayout, themeStyles.appLayout)}>
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <div className={cn(commonStyles.mainContent)}>
        <Navbar navItems={[]} profileMenuItems={profileMenuItems} user={user} />
        <main className={cn(commonStyles.pageContent, themeStyles.pageContent)}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
