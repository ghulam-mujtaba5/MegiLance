// @AI-HINT: This component displays the main chat interface for the selected conversation, including the header with contact info and the list of messages.

import React, { useEffect, useRef } from 'react';
import { Conversation, Message } from '../../types';
import './ChatWindow.common.css';
import './ChatWindow.light.css';
import './ChatWindow.dark.css';

interface ChatWindowProps {
  conversation: Conversation | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

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
