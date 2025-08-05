// @AI-HINT: This component renders the list of conversations in the sidebar. It manages the display of each conversation, highlights the active one, and handles user selection.

'use client';

import React, { useState, useEffect } from 'react';
import { Conversation } from '../../types';
import commonStyles from './ConversationList.common.module.css';
import lightStyles from './ConversationList.light.module.css';
import darkStyles from './ConversationList.dark.module.css';

interface ConversationListProps {
  selectedConversationId: number | null;
  onSelectConversation: (id: number) => void;
  refreshKey: number;
}

const ConversationList: React.FC<ConversationListProps> = ({ 
  selectedConversationId, 
  onSelectConversation, 
  refreshKey 
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/messages');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data: Conversation[] = await response.json();
        setConversations(data);
        if (data.length > 0 && selectedConversationId === null) {
          onSelectConversation(data[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [onSelectConversation, selectedConversationId, refreshKey]);
  return (
    <aside className="ConversationList-sidebar">
      <div className="ConversationList-header">
        <h2>Conversations</h2>
        {/* Placeholder for a search input or filter actions */}
      </div>
      <div className="ConversationList-items">
        {loading && <div className="ConversationList-loading">Loading...</div>}
        {error && <div className="ConversationList-error">Error: {error}</div>}
        {!loading && !error && conversations.map(convo => (
          <div 
            key={convo.id} 
            className={`ConversationList-item ${selectedConversationId === convo.id ? 'is-active' : ''}`}
            onClick={() => onSelectConversation(convo.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectConversation(convo.id)}
          >
            <img src={convo.contactAvatarUrl} alt={`${convo.contactName}'s avatar`} className="ConversationList-item-avatar" />
            <div className="ConversationList-item-content">
              <div className="ConversationList-item-header">
                <span className="ConversationList-item-name">{convo.contactName}</span>
                <span className="ConversationList-item-timestamp">{convo.lastMessageTimestamp}</span>
              </div>
              <p className="ConversationList-item-preview">{convo.lastMessage}</p>
            </div>
            {convo.unreadCount && convo.unreadCount > 0 && (
                <div className="ConversationList-item-unread">{convo.unreadCount}</div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default ConversationList;
