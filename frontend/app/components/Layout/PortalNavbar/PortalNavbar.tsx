// @AI-HINT: Dedicated navbar for the portal area. Includes search, notifications, and quick actions.
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Bell, Search, HelpCircle, Sun, Moon, LogOut, User, Settings } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import ProfileMenu, { ProfileMenuItem } from '@/app/components/ProfileMenu/ProfileMenu';
import { authApi } from '@/lib/api';

import commonStyles from './PortalNavbar.common.module.css';
import lightStyles from './PortalNavbar.light.module.css';
import darkStyles from './PortalNavbar.dark.module.css';

interface PortalNavbarProps {
  userType?: 'client' | 'freelancer' | 'admin' | 'general';
}

const PortalNavbar: React.FC<PortalNavbarProps> = ({ userType = 'client' }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  
  const [user, setUser] = useState<{ name: string; email?: string; avatar?: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const storedUser = window.localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          name: parsedUser.full_name || parsedUser.name || 'User',
          email: parsedUser.email,
          avatar: parsedUser.profile_image_url || parsedUser.avatar
        });
      }
    } catch (e) {
      console.error('Failed to parse user', e);
    }
  }, []);

  const handleLogout = () => {
    authApi.logout();
    router.push('/login');
  };

  const menuItems: ProfileMenuItem[] = [
    { 
      label: 'Profile', 
      href: userType === 'general' ? '/profile' : `/${userType}/profile`, 
      icon: <User size={16} /> 
    },
    { 
      label: 'Settings', 
      href: userType === 'general' ? '/settings' : `/${userType}/settings`, 
      icon: <Settings size={16} /> 
    },
    { 
      label: 'Sign out', 
      onClick: handleLogout, 
      icon: <LogOut size={16} /> 
    },
  ];

  // Determine page title from pathname
  const getPageTitle = () => {
    if (!pathname) return 'Dashboard';
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length <= 1) return 'Dashboard';
    
    const lastSegment = segments[segments.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className={cn(commonStyles.navbar, styles.navbar)}>
      <div className={cn(commonStyles.container, styles.container)}>
        <div className={commonStyles.leftSection}>
          <h1 className={cn(commonStyles.pageTitle, styles.pageTitle)}>
            {getPageTitle()}
          </h1>
        </div>

        <div className={cn(commonStyles.searchContainer, styles.searchContainer)}>
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className={cn(commonStyles.searchInput, styles.searchInput)}
          />
        </div>

        <div className={commonStyles.rightSection}>
          {mounted && (
            <button 
              className={cn(commonStyles.actionButton, styles.actionButton)} 
              onClick={toggleTheme}
              aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}

          <button className={cn(commonStyles.actionButton, styles.actionButton)} aria-label="Help">
            <HelpCircle size={20} />
          </button>
          
          <button className={cn(commonStyles.actionButton, styles.actionButton)} aria-label="Notifications">
            <Bell size={20} />
            <span className={commonStyles.badge} />
          </button>

          {mounted && user && (
            <ProfileMenu 
              userName={user.name}
              userEmail={user.email}
              userImageUrl={user.avatar}
              menuItems={menuItems}
              className="ml-2"
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default PortalNavbar;
