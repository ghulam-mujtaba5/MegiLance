// @AI-HINT: This component renders the list of conversations in the sidebar. It manages the display of each conversation, highlights the active one, and handles user selection.

import React from 'react';
import { Conversation } from '../../types';
import './ConversationList.common.css';
import './ConversationList.light.css';
import './ConversationList.dark.css';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: number | null;
  onSelectConversation: (id: number) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ 
  conversations, 
  selectedConversationId, 
  onSelectConversation 
}) => {
  return (
    <aside className="ConversationList-sidebar">
      <div className="ConversationList-header">
        <h2>Conversations</h2>
        {/* Placeholder for a search input or filter actions */}
      </div>
      <div className="ConversationList-items">
        {conversations.map(convo => (
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
