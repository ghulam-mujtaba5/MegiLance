// @AI-HINT: Real-time notification component with WebSocket integration, toast notifications, and notification center
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { 
  FaBell, FaCheck, FaEnvelope, FaDollarSign, FaBriefcase, 
  FaExclamationTriangle, FaTimes, FaEllipsisV 
} from 'react-icons/fa';
import commonStyles from './RealTimeNotifications.common.module.css';
import lightStyles from './RealTimeNotifications.light.module.css';
import darkStyles from './RealTimeNotifications.dark.module.css';

export interface Notification {
  id: string;
  type: 'message' | 'payment' | 'project' | 'system' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  data?: any;
}

interface RealTimeNotificationsProps {
  userId: string;
  apiBaseUrl?: string;
  onNotificationClick?: (notification: Notification) => void;
  maxDisplayed?: number;
  autoMarkAsRead?: boolean;
}

const notificationIcons = {
  message: FaEnvelope,
  payment: FaDollarSign,
  project: FaBriefcase,
  system: FaBell,
  warning: FaExclamationTriangle,
};

const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({
  userId,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  onNotificationClick,
  maxDisplayed = 5,
  autoMarkAsRead = true,
}) => {
  const { resolvedTheme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return {
      container: cn(commonStyles.container, themeStyles.container),
      bellButton: cn(commonStyles.bellButton, themeStyles.bellButton),
      badge: cn(commonStyles.badge, themeStyles.badge),
      dropdown: cn(commonStyles.dropdown, themeStyles.dropdown),
      header: cn(commonStyles.header, themeStyles.header),
      headerTitle: cn(commonStyles.headerTitle, themeStyles.headerTitle),
      markAllButton: cn(commonStyles.markAllButton, themeStyles.markAllButton),
      notificationList: cn(commonStyles.notificationList, themeStyles.notificationList),
      notificationItem: cn(commonStyles.notificationItem, themeStyles.notificationItem),
      notificationUnread: cn(commonStyles.notificationUnread, themeStyles.notificationUnread),
      notificationIcon: cn(commonStyles.notificationIcon, themeStyles.notificationIcon),
      notificationContent: cn(commonStyles.notificationContent, themeStyles.notificationContent),
      notificationTitle: cn(commonStyles.notificationTitle, themeStyles.notificationTitle),
      notificationMessage: cn(commonStyles.notificationMessage, themeStyles.notificationMessage),
      notificationTime: cn(commonStyles.notificationTime, themeStyles.notificationTime),
      notificationActions: cn(commonStyles.notificationActions, themeStyles.notificationActions),
      emptyState: cn(commonStyles.emptyState, themeStyles.emptyState),
      connectionIndicator: cn(commonStyles.connectionIndicator, themeStyles.connectionIndicator),
    };
  }, [resolvedTheme]);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const wsUrl = `${apiBaseUrl.replace('http', 'ws')}/api/realtime/notifications?token=${token}`;
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification') {
            const newNotification: Notification = {
              id: data.id || Date.now().toString(),
              type: data.notification_type || 'system',
              title: data.title,
              message: data.message,
              timestamp: new Date(data.timestamp || Date.now()),
              read: false,
              actionUrl: data.action_url,
              data: data.data,
            };
            setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep last 50
            
            // Show browser notification if permission granted
            if (Notification.permission === 'granted') {
              new Notification(newNotification.title, {
                body: newNotification.message,
                icon: '/favicon.ico',
              });
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      setWs(websocket);
    };

    connectWebSocket();

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      ws?.close();
    };
  }, [userId, apiBaseUrl]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const handleMarkAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    // TODO: Send API request to mark as read
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    // TODO: Send API request to mark all as read
  }, []);

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (autoMarkAsRead) {
        handleMarkAsRead(notification.id);
      }
      onNotificationClick?.(notification);
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
    },
    [autoMarkAsRead, handleMarkAsRead, onNotificationClick]
  );

  const handleDeleteNotification = useCallback((notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    // TODO: Send API request to delete notification
  }, []);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <FaBell />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
        {connectionStatus !== 'connected' && (
          <span className={styles.connectionIndicator} title={connectionStatus} />
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3 className={styles.headerTitle}>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className={styles.markAllButton}>
                <FaCheck /> Mark all as read
              </button>
            )}
          </div>

          <div className={styles.notificationList}>
            {notifications.length > 0 ? (
              notifications.slice(0, maxDisplayed).map((notification) => {
                const Icon = notificationIcons[notification.type] || FaBell;
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      styles.notificationItem,
                      !notification.read && styles.notificationUnread
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={styles.notificationIcon}>
                      <Icon />
                    </div>
                    <div className={styles.notificationContent}>
                      <div className={styles.notificationTitle}>{notification.title}</div>
                      <div className={styles.notificationMessage}>{notification.message}</div>
                      <div className={styles.notificationTime}>
                        {formatTimestamp(notification.timestamp)}
                      </div>
                    </div>
                    <button
                      className={styles.notificationActions}
                      onClick={(e) => handleDeleteNotification(notification.id, e)}
                      aria-label="Delete notification"
                    >
                      <FaTimes />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className={styles.emptyState}>
                <FaBell />
                <p>No notifications yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeNotifications;
