// @AI-HINT: Notifications page under portal layout. Theme-aware, accessible. Fetches from notifications API.
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { useToaster } from '@/app/components/Toast/ToasterProvider';
import { Loader2 } from 'lucide-react';
import common from './Notifications.common.module.css';
import light from './Notifications.light.module.css';
import dark from './Notifications.dark.module.css';

const ALL = 'All';
const CATEGORIES = [ALL, 'System', 'Messages', 'Billing'] as const;

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  category: (typeof CATEGORIES)[number] | 'All';
  time: string;
  unread?: boolean;
};

const Notifications: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { notify } = useToaster();
  const [selected, setSelected] = useState<(typeof CATEGORIES)[number]>(ALL);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch('/backend/api/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();
        
        // Transform API data to NotificationItem format
        const notifications: NotificationItem[] = (Array.isArray(data) ? data : []).map((n: any, idx: number) => {
          // Map notification type to category
          let category: NotificationItem['category'] = 'System';
          const type = (n.type || '').toLowerCase();
          if (type.includes('message') || type.includes('chat')) category = 'Messages';
          else if (type.includes('payment') || type.includes('invoice') || type.includes('billing')) category = 'Billing';
          
          // Format timestamp
          const time = n.created_at 
            ? formatTimeAgo(new Date(n.created_at))
            : 'Recently';
          
          return {
            id: String(n.id || idx),
            title: n.title || n.type || 'Notification',
            body: n.message || n.content || n.body || '',
            category,
            time,
            unread: n.is_read === false || n.unread === true,
          };
        });

        setNotifs(notifications);
        setError(null);
      } catch (err) {
        setError('Failed to load notifications');
        // Provide fallback with empty array
        setNotifs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filtered = useMemo(
    () => (selected === ALL ? notifs : notifs.filter((i) => i.category === selected)),
    [selected, notifs]
  );

  const headerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const listVisible = useIntersectionObserver(listRef, { threshold: 0.1 });

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/backend/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (e) {
      // Continue with local update even if API fails
    }
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
    setStatus('All notifications marked as read');
    notify({ title: 'Marked as read', description: 'All notifications are now read.', variant: 'success', duration: 2500 });
  };

  const clearAll = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/backend/api/notifications/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (e) {
      // Continue with local update
    }
    setNotifs([]);
    setStatus('All notifications cleared');
    notify({ title: 'Notifications cleared', description: 'Your list is now empty.', variant: 'info', duration: 2500 });
  };

  const markRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/backend/api/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (e) {
      // Continue with local update
    }
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    const n = notifs.find((x) => x.id === id);
    setStatus(n ? `${n.title} marked as read` : 'Notification marked as read');
    notify({ title: 'Marked read', description: n ? n.title : 'Notification', variant: 'success', duration: 2200 });
  };

  const archive = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/backend/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (e) {
      // Continue with local update
    }
    const n = notifs.find((x) => x.id === id);
    setNotifs((prev) => prev.filter((x) => x.id !== id));
    setStatus(n ? `${n.title} archived` : 'Notification archived');
    notify({ title: 'Archived', description: n ? n.title : 'Notification archived', variant: 'info', duration: 2200 });
  };

  if (!resolvedTheme) return null;

  if (loading) {
    return (
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <div className={common.loadingState}>
            <Loader2 className={common.spinner} size={32} />
            <span>Loading notifications...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        {error && (
          <div className={cn(common.errorBanner, themed.errorBanner)}>
            {error}
          </div>
        )}
        <div ref={headerRef} className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}>
          <h1 className={common.title}>Notifications</h1>
          <div className={common.filters} role="toolbar" aria-label="Filter notifications">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={common.chip}
                aria-pressed={(selected === c) || undefined}
                onClick={() => setSelected(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className={common.actionsBar} role="toolbar" aria-label="Notification actions">
            <button type="button" className={common.button} onClick={markAllRead}>Mark all read</button>
            <button type="button" className={cn(common.button, common.buttonSecondary)} onClick={clearAll}>Clear all</button>
            <p className={common.srOnly} aria-live="polite">{status}</p>
          </div>
        </div>

        {notifs.length === 0 ? (
          <EmptyState
            title="No notifications"
            description="You're all caught up! New notifications will appear here."
            action={
              <button
                type="button"
                className={common.button}
                onClick={() => notify({ title: 'All caught up', description: 'Nothing to review right now.', variant: 'info', duration: 2200 })}
              >
                Refresh
              </button>
            }
          />
        ) : (
          <div ref={listRef} className={cn(common.list, listVisible ? common.isVisible : common.isNotVisible)} role="list" aria-label="Notification list">
            {filtered.map((n) => (
              <div key={n.id} role="listitem" className={common.item}>
                <div>
                  <div className={common.itemHeader}>
                    <span className={common.dot} aria-hidden="true" />
                    <div>
                      <div className={common.itemTitle}>{n.title}</div>
                      <div className={common.meta}>{n.time} • {n.category}</div>
                    </div>
                  </div>
                  <div className={common.itemBody}>{n.body}</div>
                </div>
                <div className={common.actions} aria-label={`Actions for ${n.title}`}>
                  <button className={common.button} onClick={() => markRead(n.id)}>Mark read</button>
                  <button className={cn(common.button, common.buttonSecondary)} onClick={() => archive(n.id)}>Archive</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Notifications;
