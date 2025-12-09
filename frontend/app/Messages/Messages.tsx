// @AI-HINT: Messages page - displays real conversation list from API
// Production-ready: No mock data, connects to /backend/api/messages
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { MessageSquare, Search, User, Loader2 } from 'lucide-react';

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
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  try {
    const res = await fetch(`/backend/api/messages${endpoint}`, {
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
    } catch (err) {
      console.error('[Messages] Failed to load conversations:', err);
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
    <div className="min-h-screen p-6 md:p-8" style={{ background: resolvedTheme === 'dark' ? '#0f172a' : '#f8fafc' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare size={28} className={resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} />
          <h1 className={`text-2xl md:text-3xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Messages
          </h1>
        </div>

        {/* Search */}
        <div className={`relative mb-6`}>
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-11 pr-4 py-3 rounded-xl border ${
              resolvedTheme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-white placeholder:text-gray-500'
                : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
            }`}
          />
        </div>

        {/* Conversations */}
        <div className={`rounded-xl overflow-hidden ${resolvedTheme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className={`w-12 h-12 mx-auto mb-3 ${resolvedTheme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
              </p>
              <p className={`text-sm mt-1 ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                Start a conversation by messaging a freelancer or client
              </p>
            </div>
          ) : (
            filteredConversations.map((conv, idx) => (
              <button
                key={conv.id}
                className={`w-full p-4 flex items-center gap-4 text-left transition-colors ${
                  idx !== filteredConversations.length - 1 ? 'border-b border-gray-200 dark:border-slate-700' : ''
                } ${resolvedTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-gray-50'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
                  resolvedTheme === 'dark' ? 'bg-primary-600 text-white' : 'bg-primary-100 text-primary-600'
                }`}>
                  {conv.avatar ? (
                    <img src={conv.avatar} alt={conv.contact_name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(conv.contact_name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`font-semibold truncate ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {conv.contact_name}
                    </p>
                    <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatTimeAgo(conv.last_message_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {conv.last_message}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-primary-600 text-white rounded-full">
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
    </div>
  );
};

export default Messages;
