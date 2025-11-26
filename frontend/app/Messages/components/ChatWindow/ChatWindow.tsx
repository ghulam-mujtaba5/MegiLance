// @AI-HINT: This component displays the main chat interface for the selected conversation, including the header with contact info and the list of messages.

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { Conversation } from '../types';
import commonStyles from './ChatWindow.common.module.css';
import lightStyles from './ChatWindow.light.module.css';
import darkStyles from './ChatWindow.dark.module.css';

interface ChatWindowProps {
  conversationId: number | null;
  refreshKey: number;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, refreshKey }) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchConversationDetails = async () => {
      if (!conversationId) {
        setConversation(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const [convData, msgsData, me] = await Promise.all([
          api.messages.getConversation(conversationId),
          api.messages.getMessages(conversationId),
          api.auth.me()
        ]);
        
        const mappedMessages = msgsData.map((m: any) => ({
          id: m.id,
          text: m.content,
          timestamp: new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sender: m.sender_id === me.id ? 'user' : 'contact'
        }));

        setConversation({
          id: convData.id,
          contactName: convData.contact_name || 'Unknown',
          avatar: convData.avatar || '/default-avatar.png',
          lastMessage: '',
          lastMessageTimestamp: '',
          unreadCount: 0,
          messages: mappedMessages
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConversationDetails();
  }, [conversationId, refreshKey]);

  useEffect(() => {
    if (conversation) {
      scrollToBottom();
    }
  }, [conversation]);

  if (!conversationId) {
    return (
      <div className={commonStyles.placeholder}>
        <div className={commonStyles.placeholderContent}>
          <h2>Welcome to your Inbox</h2>
          <p>Select a conversation from the sidebar to start chatting.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className={commonStyles.placeholder}>Loading conversation...</div>;
  }

  if (error) {
    return <div className={commonStyles.placeholder}>Error: {error}</div>;
  }

  if (!conversation) {
    return (
      <div className={commonStyles.placeholder}>
        <div className={commonStyles.placeholderContent}>
          <h2>Welcome to your Inbox</h2>
          <p>Select a conversation from the sidebar to start chatting.</p>
        </div>
      </div>
    );
  }

  return (
    <main className={commonStyles.main}>
      <header className={commonStyles.header}>
        <Image src={conversation.avatar} alt={`${conversation.contactName}&apos;s avatar`} className={commonStyles.headerAvatar} width={48} height={48} />
        <div className={commonStyles.headerInfo}>
          <h3 className={commonStyles.headerName}>{conversation.contactName}</h3>
          {/* Placeholder for online status */}
          <p className={commonStyles.headerStatus}>Online</p> 
        </div>
        {/* Placeholder for actions like search, call, etc. */}
      </header>
      <div className={commonStyles.messages}>
        {conversation.messages.map(msg => (
          <div key={msg.id} className={cn(commonStyles.message, commonStyles[msg.sender === 'user' ? 'sent' : 'received'])}>
            <div className={commonStyles.bubble}>
              <p className={commonStyles.text}>{msg.text}</p>
            </div>
            <span className={commonStyles.timestamp}>{msg.timestamp}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </main>
  );
};

export default ChatWindow;
