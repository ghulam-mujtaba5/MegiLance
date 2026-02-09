// @AI-HINT: Redesigned portal navbar with working notifications, help menu, quick actions, and improved UX.
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { 
  Bell, Search, HelpCircle, Sun, Moon, LogOut, User, Settings, 
  X, Check, CheckCheck, ExternalLink, MessageSquare, FileText,
  Briefcase, CreditCard, AlertCircle, Clock, ChevronRight,
  Keyboard, BookOpen, Mail, Shield, Wallet, Menu
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProfileMenu, { ProfileMenuItem } from '@/app/components/ProfileMenu/ProfileMenu';
import { authApi, getAuthToken, clearAuthData } from '@/lib/api';

import commonStyles from './PortalNavbar.common.module.css';
import lightStyles from './PortalNavbar.light.module.css';
import darkStyles from './PortalNavbar.dark.module.css';

interface Notification {
  id: string;
  type: 'message' | 'project' | 'payment' | 'alert' | 'system';
  title: string;
  description: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}

interface PortalNavbarProps {
  userType?: 'client' | 'freelancer' | 'admin' | 'general';
  onMenuToggle?: () => void;
}

// Fetch real notifications from API
async function fetchNotifications(): Promise<Notification[]> {
  const token = getAuthToken();
  if (!token) return [];
  try {
    const res = await fetch('/backend/api/notifications?limit=10', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.notifications || data || []).map((n: any) => ({
      id: String(n.id),
      type: n.type || 'system',
      title: n.title || 'Notification',
      description: n.message || n.description || '',
      time: formatTimeAgo(n.created_at),
      read: n.is_read || false,
      actionUrl: n.action_url,
    }));
  } catch {
    return [];
  }
}

// Format time ago helper
function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

const PortalNavbar: React.FC<PortalNavbarProps> = ({ userType = 'client', onMenuToggle }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  
  const [user, setUser] = useState<{ name: string; email?: string; avatar?: string } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

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
    
    // Fetch real notifications
    fetchNotifications().then(setNotifications);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setShowHelpMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector(`.${commonStyles.searchInput}`) as HTMLInputElement;
        searchInput?.focus();
      }
      // Escape to close dropdowns
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowHelpMenu(false);
        setShowSearchResults(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = useCallback(() => {
    clearAuthData();
    router.push('/login');
  }, [router]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare size={16} className={commonStyles.notifIconMessage} />;
      case 'project': return <Briefcase size={16} className={commonStyles.notifIconProject} />;
      case 'payment': return <CreditCard size={16} className={commonStyles.notifIconPayment} />;
      case 'alert': return <AlertCircle size={16} className={commonStyles.notifIconAlert} />;
      default: return <Bell size={16} className={commonStyles.notifIconSystem} />;
    }
  };

  const menuItems: ProfileMenuItem[] = [
    { 
      label: 'View Profile', 
      href: userType === 'general' ? '/profile' : `/${userType}/profile`, 
      icon: <User size={16} /> 
    },
    { 
      label: 'Account Settings', 
      href: userType === 'general' ? '/settings' : `/${userType}/settings`, 
      icon: <Settings size={16} /> 
    },
    { 
      label: 'Wallet & Payments', 
      href: userType === 'general' ? '/wallet' : `/${userType}/wallet`, 
      icon: <Wallet size={16} /> 
    },
    { 
      label: 'Security', 
      href: userType === 'general' ? '/settings' : `/${userType}/settings?tab=security`, 
      icon: <Shield size={16} /> 
    },
    { 
      label: 'Sign Out', 
      onClick: handleLogout, 
      icon: <LogOut size={16} /> 
    },
  ];

  const helpMenuItems = [
    { label: 'Help Center', href: '/help', icon: <BookOpen size={16} />, description: 'Browse help articles' },
    { label: 'Keyboard Shortcuts', icon: <Keyboard size={16} />, description: 'Ctrl+K to search', onClick: () => {} },
    { label: 'Contact Support', href: '/portal/support', icon: <Mail size={16} />, description: 'Get help from our team' },
    { label: 'Documentation', href: '/docs', icon: <FileText size={16} />, description: 'API & developer docs', external: true },
  ];

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

  if (!mounted) return null;

  return (
    <header className={cn(commonStyles.navbar, styles.navbar)}>
      <div className={cn(commonStyles.container, styles.container)}>
        <div className={commonStyles.leftSection}>
          {/* Mobile hamburger menu */}
          {onMenuToggle && (
            <button 
              className={cn(commonStyles.menuButton, styles.actionButton)}
              onClick={onMenuToggle}
              aria-label="Toggle navigation menu"
              title="Menu"
            >
              <Menu size={22} />
            </button>
          )}
          <h1 className={cn(commonStyles.pageTitle, styles.pageTitle)}>
            {getPageTitle()}
          </h1>
        </div>

        {/* Enhanced Search */}
        <div className={cn(commonStyles.searchContainer, styles.searchContainer)} ref={searchRef}>
          <Search size={18} className={commonStyles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search... (Ctrl+K)" 
            className={cn(commonStyles.searchInput, styles.searchInput)}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(e.target.value.length > 0);
            }}
            onFocus={() => searchQuery && setShowSearchResults(true)}
          />
          {searchQuery && (
            <button 
              className={commonStyles.searchClear}
              onClick={() => { setSearchQuery(''); setShowSearchResults(false); }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
          
          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className={cn(commonStyles.searchDropdown, styles.searchDropdown)}>
              <div className={commonStyles.searchSection}>
                <span className={commonStyles.searchSectionTitle}>Quick Actions</span>
                <Link href={`/${userType}/post-job`} className={commonStyles.searchItem}>
                  <Briefcase size={14} /> Post a new job
                </Link>
                <Link href={`/${userType}/messages`} className={commonStyles.searchItem}>
                  <MessageSquare size={14} /> View messages
                </Link>
              </div>
              <div className={commonStyles.searchSection}>
                <span className={commonStyles.searchSectionTitle}>Pages</span>
                <Link href={`/${userType}/projects`} className={commonStyles.searchItem}>
                  <FileText size={14} /> Projects
                </Link>
                <Link href={`/${userType}/settings`} className={commonStyles.searchItem}>
                  <Settings size={14} /> Settings
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className={commonStyles.rightSection}>
          {/* Theme Toggle */}
          <button 
            className={cn(commonStyles.actionButton, styles.actionButton)} 
            onClick={toggleTheme}
            aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Help Menu */}
          <div className={commonStyles.dropdownWrapper} ref={helpRef}>
            <button 
              className={cn(commonStyles.actionButton, styles.actionButton)} 
              aria-label="Help"
              onClick={() => setShowHelpMenu(!showHelpMenu)}
              title="Help & Resources"
            >
              <HelpCircle size={20} />
            </button>
            
            {showHelpMenu && (
              <div className={cn(commonStyles.helpDropdown, styles.helpDropdown)}>
                <div className={commonStyles.helpHeader}>
                  <span className={commonStyles.helpTitle}>Help & Resources</span>
                </div>
                <div className={commonStyles.helpItems}>
                  {helpMenuItems.map((item, idx) => (
                    item.href ? (
                      <Link 
                        key={idx} 
                        href={item.href} 
                        className={commonStyles.helpItem}
                        onClick={() => setShowHelpMenu(false)}
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noopener noreferrer' : undefined}
                      >
                        <span className={commonStyles.helpItemIcon}>{item.icon}</span>
                        <div className={commonStyles.helpItemContent}>
                          <span className={commonStyles.helpItemLabel}>{item.label}</span>
                          <span className={commonStyles.helpItemDesc}>{item.description}</span>
                        </div>
                        {item.external && <ExternalLink size={12} className={commonStyles.externalIcon} />}
                      </Link>
                    ) : (
                      <button 
                        key={idx} 
                        className={commonStyles.helpItem}
                        onClick={() => { item.onClick?.(); setShowHelpMenu(false); }}
                      >
                        <span className={commonStyles.helpItemIcon}>{item.icon}</span>
                        <div className={commonStyles.helpItemContent}>
                          <span className={commonStyles.helpItemLabel}>{item.label}</span>
                          <span className={commonStyles.helpItemDesc}>{item.description}</span>
                        </div>
                      </button>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Notifications */}
          <div className={commonStyles.dropdownWrapper} ref={notificationRef}>
            <button 
              className={cn(commonStyles.actionButton, styles.actionButton, showNotifications && commonStyles.actionButtonActive)} 
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className={commonStyles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className={cn(commonStyles.notificationDropdown, styles.notificationDropdown)}>
                <div className={commonStyles.notificationHeader}>
                  <span className={commonStyles.notificationTitle}>Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      className={commonStyles.markAllRead}
                      onClick={markAllAsRead}
                      title="Mark all as read"
                    >
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                </div>
                
                <div className={commonStyles.notificationList}>
                  {notifications.length === 0 ? (
                    <div className={commonStyles.emptyNotifications}>
                      <Bell size={32} className={commonStyles.emptyIcon} />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={cn(
                          commonStyles.notificationItem, 
                          styles.notificationItem,
                          !notif.read && commonStyles.unread
                        )}
                        onClick={() => {
                          markAsRead(notif.id);
                          if (notif.actionUrl) router.push(notif.actionUrl);
                          setShowNotifications(false);
                        }}
                      >
                        <div className={commonStyles.notificationIcon}>
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className={commonStyles.notificationContent}>
                          <span className={commonStyles.notificationItemTitle}>{notif.title}</span>
                          <span className={commonStyles.notificationDesc}>{notif.description}</span>
                          <span className={commonStyles.notificationTime}>
                            <Clock size={12} /> {notif.time}
                          </span>
                        </div>
                        {!notif.read && (
                          <button 
                            className={commonStyles.markRead}
                            onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
                
                <Link 
                  href="/notifications" 
                  className={commonStyles.viewAllLink}
                  onClick={() => setShowNotifications(false)}
                >
                  View all notifications <ChevronRight size={14} />
                </Link>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          {user && (
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
