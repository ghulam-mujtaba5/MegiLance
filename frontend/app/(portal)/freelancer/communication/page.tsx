// @AI-HINT: Unified communication center with messages, notifications, and announcements
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '../../../components/Button/Button';
import commonStyles from './Communication.common.module.css';
import lightStyles from './Communication.light.module.css';
import darkStyles from './Communication.dark.module.css';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  subject: string;
  preview: string;
  content: string;
  is_read: boolean;
  is_starred: boolean;
  thread_id?: string;
  created_at: string;
  attachments?: { name: string; url: string; size: number }[];
}

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expires_at?: string;
  created_at: string;
}

type TabType = 'inbox' | 'sent' | 'starred' | 'notifications' | 'announcements';

export default function CommunicationPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', content: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    loadCommunicationData();
  }, []);

  const loadCommunicationData = async () => {
    setLoading(true);
    try {
      // Simulated API calls - replace with actual API integration
      // const [inboxRes, sentRes, notifRes, announcementsRes] = await Promise.all([
      //   communicationCenterApi.getInbox(),
      //   communicationCenterApi.getSentMessages(),
      //   communicationCenterApi.getNotifications(),
      //   communicationCenterApi.getAnnouncements()
      // ]);

      // Mock data
      setMessages([
        {
          id: '1',
          sender_id: 'user1',
          sender_name: 'John Client',
          subject: 'Project Discussion',
          preview: 'Hi, I wanted to discuss the project requirements...',
          content: 'Hi, I wanted to discuss the project requirements in more detail. Can we schedule a call this week?',
          is_read: false,
          is_starred: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          sender_id: 'user2',
          sender_name: 'Sarah Manager',
          subject: 'Contract Update',
          preview: 'Your contract has been approved...',
          content: 'Your contract has been approved. Please review the terms and sign at your earliest convenience.',
          is_read: true,
          is_starred: false,
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]);

      setNotifications([
        {
          id: 'n1',
          type: 'success',
          title: 'Payment Received',
          message: 'You received $500 for Project Alpha',
          is_read: false,
          created_at: new Date().toISOString()
        },
        {
          id: 'n2',
          type: 'info',
          title: 'New Proposal',
          message: 'You have a new proposal invitation',
          is_read: true,
          action_url: '/freelancer/proposals',
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ]);

      setAnnouncements([
        {
          id: 'a1',
          title: 'Platform Update',
          content: 'We have released new features including improved messaging and file sharing.',
          priority: 'normal',
          created_at: new Date().toISOString()
        },
        {
          id: 'a2',
          title: 'Scheduled Maintenance',
          content: 'Platform maintenance scheduled for Sunday 2AM-4AM UTC.',
          priority: 'high',
          expires_at: new Date(Date.now() + 604800000).toISOString(),
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ]);
    } catch (error) {
      console.error('Failed to load communication data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, is_read: true } : m))
    );
  };

  const handleToggleStar = async (messageId: string) => {
    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, is_starred: !m.is_starred } : m))
    );
  };

  const handleSendMessage = async () => {
    if (!composeData.to || !composeData.subject || !composeData.content) return;

    try {
      // await communicationCenterApi.sendMessage(composeData);
      setIsComposing(false);
      setComposeData({ to: '', subject: '', content: '' });
      // Refresh sent messages
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleMarkNotificationRead = async (notifId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notifId ? { ...n, is_read: true } : n))
    );
  };

  const getUnreadCount = (type: TabType) => {
    switch (type) {
      case 'inbox':
        return messages.filter(m => !m.is_read).length;
      case 'starred':
        return messages.filter(m => m.is_starred).length;
      case 'notifications':
        return notifications.filter(n => !n.is_read).length;
      default:
        return 0;
    }
  };

  const filteredMessages = messages.filter(m => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        m.subject.toLowerCase().includes(query) ||
        m.sender_name.toLowerCase().includes(query) ||
        m.preview.toLowerCase().includes(query)
      );
    }
    if (activeTab === 'starred') return m.is_starred;
    return true;
  });

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={cn(commonStyles.header, themeStyles.header)}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>
            Communication Center
          </h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Manage all your messages, notifications, and platform announcements
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsComposing(true)}>
          Compose Message
        </Button>
      </div>

      {/* Search Bar */}
      <div className={cn(commonStyles.searchBar, themeStyles.searchBar)}>
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(commonStyles.searchInput, themeStyles.searchInput)}
        />
      </div>

      {/* Tabs */}
      <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
        {(['inbox', 'sent', 'starred', 'notifications', 'announcements'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              commonStyles.tab,
              themeStyles.tab,
              activeTab === tab && commonStyles.tabActive,
              activeTab === tab && themeStyles.tabActive
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {getUnreadCount(tab) > 0 && (
              <span className={cn(commonStyles.badge, themeStyles.badge)}>
                {getUnreadCount(tab)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className={cn(commonStyles.content, themeStyles.content)}>
        {loading ? (
          <div className={commonStyles.loading}>Loading...</div>
        ) : (
          <>
            {/* Messages List */}
            {(activeTab === 'inbox' || activeTab === 'sent' || activeTab === 'starred') && (
              <div className={commonStyles.splitView}>
                <div className={cn(commonStyles.messageList, themeStyles.messageList)}>
                  {filteredMessages.length === 0 ? (
                    <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                      <p>No messages found</p>
                    </div>
                  ) : (
                    filteredMessages.map(message => (
                      <div
                        key={message.id}
                        onClick={() => {
                          setSelectedMessage(message);
                          handleMarkAsRead(message.id);
                        }}
                        className={cn(
                          commonStyles.messageItem,
                          themeStyles.messageItem,
                          !message.is_read && commonStyles.unread,
                          !message.is_read && themeStyles.unread,
                          selectedMessage?.id === message.id && commonStyles.selected,
                          selectedMessage?.id === message.id && themeStyles.selected
                        )}
                      >
                        <div className={commonStyles.messageHeader}>
                          <div className={commonStyles.senderInfo}>
                            <div className={cn(commonStyles.avatar, themeStyles.avatar)}>
                              {message.sender_name.charAt(0)}
                            </div>
                            <div>
                              <span className={cn(commonStyles.senderName, themeStyles.senderName)}>
                                {message.sender_name}
                              </span>
                              <span className={cn(commonStyles.messageDate, themeStyles.messageDate)}>
                                {new Date(message.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStar(message.id);
                            }}
                            className={cn(
                              commonStyles.starBtn,
                              themeStyles.starBtn,
                              message.is_starred && commonStyles.starred,
                              message.is_starred && themeStyles.starred
                            )}
                          >
                            ★
                          </button>
                        </div>
                        <h4 className={cn(commonStyles.messageSubject, themeStyles.messageSubject)}>
                          {message.subject}
                        </h4>
                        <p className={cn(commonStyles.messagePreview, themeStyles.messagePreview)}>
                          {message.preview}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Detail */}
                <div className={cn(commonStyles.messageDetail, themeStyles.messageDetail)}>
                  {selectedMessage ? (
                    <>
                      <div className={cn(commonStyles.detailHeader, themeStyles.detailHeader)}>
                        <h2>{selectedMessage.subject}</h2>
                        <div className={commonStyles.detailMeta}>
                          <span>From: {selectedMessage.sender_name}</span>
                          <span>{new Date(selectedMessage.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className={cn(commonStyles.detailContent, themeStyles.detailContent)}>
                        <p>{selectedMessage.content}</p>
                      </div>
                      <div className={commonStyles.detailActions}>
                        <Button variant="primary" size="sm">Reply</Button>
                        <Button variant="secondary" size="sm">Forward</Button>
                        <Button variant="ghost" size="sm">Archive</Button>
                      </div>
                    </>
                  ) : (
                    <div className={cn(commonStyles.noSelection, themeStyles.noSelection)}>
                      <p>Select a message to view</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className={cn(commonStyles.notificationList, themeStyles.notificationList)}>
                {notifications.length === 0 ? (
                  <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkNotificationRead(notif.id)}
                      className={cn(
                        commonStyles.notificationItem,
                        themeStyles.notificationItem,
                        commonStyles[`notif${notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}`],
                        themeStyles[`notif${notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}`],
                        !notif.is_read && commonStyles.unreadNotif,
                        !notif.is_read && themeStyles.unreadNotif
                      )}
                    >
                      <div className={cn(commonStyles.notifIcon, themeStyles.notifIcon)}>
                        {notif.type === 'success' && '✓'}
                        {notif.type === 'info' && 'ℹ'}
                        {notif.type === 'warning' && '⚠'}
                        {notif.type === 'error' && '✕'}
                      </div>
                      <div className={commonStyles.notifContent}>
                        <h4 className={cn(commonStyles.notifTitle, themeStyles.notifTitle)}>
                          {notif.title}
                        </h4>
                        <p className={cn(commonStyles.notifMessage, themeStyles.notifMessage)}>
                          {notif.message}
                        </p>
                        <span className={cn(commonStyles.notifDate, themeStyles.notifDate)}>
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
                      </div>
                      {notif.action_url && (
                        <Button variant="link" size="sm">View</Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Announcements */}
            {activeTab === 'announcements' && (
              <div className={cn(commonStyles.announcementList, themeStyles.announcementList)}>
                {announcements.length === 0 ? (
                  <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                    <p>No announcements</p>
                  </div>
                ) : (
                  announcements.map(announcement => (
                    <div
                      key={announcement.id}
                      className={cn(
                        commonStyles.announcementItem,
                        themeStyles.announcementItem,
                        commonStyles[`priority${announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}`],
                        themeStyles[`priority${announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}`]
                      )}
                    >
                      <div className={commonStyles.announcementHeader}>
                        <h3 className={cn(commonStyles.announcementTitle, themeStyles.announcementTitle)}>
                          {announcement.title}
                        </h3>
                        <span className={cn(
                          commonStyles.priorityBadge,
                          themeStyles.priorityBadge,
                          commonStyles[`badge${announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}`],
                          themeStyles[`badge${announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}`]
                        )}>
                          {announcement.priority}
                        </span>
                      </div>
                      <p className={cn(commonStyles.announcementContent, themeStyles.announcementContent)}>
                        {announcement.content}
                      </p>
                      <div className={cn(commonStyles.announcementMeta, themeStyles.announcementMeta)}>
                        <span>Posted: {new Date(announcement.created_at).toLocaleDateString()}</span>
                        {announcement.expires_at && (
                          <span>Expires: {new Date(announcement.expires_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Compose Modal */}
      {isComposing && (
        <div className={cn(commonStyles.modal, themeStyles.modal)}>
          <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
            <div className={cn(commonStyles.modalHeader, themeStyles.modalHeader)}>
              <h2>New Message</h2>
              <button
                onClick={() => setIsComposing(false)}
                className={cn(commonStyles.closeBtn, themeStyles.closeBtn)}
              >
                ×
              </button>
            </div>
            <div className={commonStyles.composeForm}>
              <div className={commonStyles.formGroup}>
                <label>To:</label>
                <input
                  type="text"
                  value={composeData.to}
                  onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="Recipient username or email"
                  className={cn(commonStyles.input, themeStyles.input)}
                />
              </div>
              <div className={commonStyles.formGroup}>
                <label>Subject:</label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Message subject"
                  className={cn(commonStyles.input, themeStyles.input)}
                />
              </div>
              <div className={commonStyles.formGroup}>
                <label>Message:</label>
                <textarea
                  value={composeData.content}
                  onChange={(e) => setComposeData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your message..."
                  rows={8}
                  className={cn(commonStyles.textarea, themeStyles.textarea)}
                />
              </div>
              <div className={commonStyles.modalActions}>
                <Button variant="secondary" onClick={() => setIsComposing(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSendMessage}>
                  Send Message
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
