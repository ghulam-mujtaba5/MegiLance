// @AI-HINT: This component displays the main chat interface for the selected conversation, including the header with contact info and the list of messages.

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Conversation } from '../../types';
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
        const response = await fetch(`/api/messages/${conversationId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch conversation details');
        }
        const data: Conversation = await response.json();
        setConversation(data);
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
      <div className="ChatWindow-placeholder">
        <div className="ChatWindow-placeholder-content">
          <h2>Welcome to your Inbox</h2>
          <p>Select a conversation from the sidebar to start chatting.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="ChatWindow-placeholder">Loading conversation...</div>;
  }

  if (error) {
    return <div className="ChatWindow-placeholder">Error: {error}</div>;
  }

  if (!conversation) {
    return (
      <div className="ChatWindow-placeholder">
        <div className="ChatWindow-placeholder-content">
          <h2>Welcome to your Inbox</h2>
          <p>Select a conversation from the sidebar to start chatting.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="ChatWindow-main">
      <header className="ChatWindow-header">
        <img src={conversation.contactAvatarUrl} alt={`${conversation.contactName}'s avatar`} className="ChatWindow-header-avatar" />
        <div className="ChatWindow-header-info">
          <h3 className="ChatWindow-header-name">{conversation.contactName}</h3>
          {/* Placeholder for online status */}
          <p className="ChatWindow-header-status">Online</p> 
        </div>
        {/* Placeholder for actions like search, call, etc. */}
      </header>
      <div className="ChatWindow-messages">
        {conversation.messages.map(msg => (
          <div key={msg.id} className={`ChatMessage ChatMessage--${msg.sender}`}>
            <div className="ChatMessage-bubble">
              <p className="ChatMessage-text">{msg.text}</p>
            </div>
            <span className="ChatMessage-timestamp">{msg.timestamp}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </main>
  );
};

export default ChatWindow;
