// @AI-HINT: Messages page - displays real conversation list from API
// Production-ready: No mock data, connects to /api/messages
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { MessageSquare, Search, Loader2 } from 'lucide-react';
import { getAuthToken } from '@/lib/api';

import commonStyles from './Messages.common.module.css';
import lightStyles from './Messages.light.module.css';
import darkStyles from './Messages.dark.module.css';

interface Conversation {
  id: number;
  contact_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  avatar?: string;
  status: string;
}

// API helper
async function fetchApi<T>(endpoint: string): Promise<T | null> {
  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  try {
    const res = await fetch(`/api${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Format relative time
function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
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
}

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const Messages: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi<any[]>('/conversations?limit=50');
      if (data && Array.isArray(data)) {
        const mapped: Conversation[] = data.map((conv: any) => ({
          id: conv.id,
          contact_name: conv.contact_name || 'Unknown User',
          last_message: conv.last_message || 'No messages yet',
          last_message_at: conv.last_message_at || conv.created_at,
          unread_count: conv.unread_count || 0,
          avatar: conv.avatar,
          status: conv.status || 'active',
        }));
        setConversations(mapped);
      }
    } catch {
      // Silently handle - conversations will show as empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    loadConversations();
  }, [loadConversations]);

  if (!mounted) return null;

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv =>
    conv.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={commonStyles.container}>
      <div className={commonStyles.header}>
        <MessageSquare className={cn(commonStyles.headerIcon, themeStyles.headerIcon)} />
        <h1 className={cn(commonStyles.title, themeStyles.title)}>Messages</h1>
      </div>

      {/* Search */}
      <div className={commonStyles.searchWrapper}>
        <Search className={cn(commonStyles.searchIcon, themeStyles.searchIcon)} />
        <input
          type="text"
          placeholder="Search conversations..."
          aria-label="Search conversations"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(commonStyles.searchInput, themeStyles.searchInput)}
        />
      </div>

      {/* Conversations */}
      <div className={cn(commonStyles.conversationList, themeStyles.conversationList)}>
        {loading ? (
          <div className={commonStyles.loadingState}>
            <Loader2 className={cn(commonStyles.spinner, themeStyles.spinner)} />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className={commonStyles.emptyState}>
            <MessageSquare className={cn(commonStyles.emptyIcon, themeStyles.emptyIcon)} />
            <p className={cn(commonStyles.emptyTitle, themeStyles.emptyTitle)}>
              {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
            </p>
            <p className={cn(commonStyles.emptySubtitle, themeStyles.emptySubtitle)}>
              Start a conversation by messaging a freelancer or client
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <button
              key={conv.id}
              className={cn(commonStyles.conversationButton, themeStyles.conversationButton)}
            >
              <div className={cn(commonStyles.avatar, themeStyles.avatar)}>
                {conv.avatar ? (
                  <img src={conv.avatar} alt={conv.contact_name} className={commonStyles.avatarImage} />
                ) : (
                  getInitials(conv.contact_name)
                )}
              </div>
              <div className={commonStyles.conversationContent}>
                <div className={commonStyles.conversationTop}>
                  <p className={cn(commonStyles.contactName, themeStyles.contactName)}>
                    {conv.contact_name}
                  </p>
                  <span className={cn(commonStyles.timestamp, themeStyles.timestamp)}>
                    {formatTimeAgo(conv.last_message_at)}
                  </span>
                </div>
                <div className={commonStyles.conversationBottom}>
                  <p className={cn(commonStyles.lastMessage, themeStyles.lastMessage)}>
                    {conv.last_message}
                  </p>
                  {conv.unread_count > 0 && (
                    <span className={commonStyles.unreadBadge}>
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default Messages;
