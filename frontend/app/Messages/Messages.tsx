// @AI-HINT: This is the root component for the Messages page. It assembles the modular sub-components and manages the application state for the messaging interface.
'use client';
import React, { useState } from 'react';

// Data and Types
import { mockConversations } from './mock-data';
import { Conversation, Message } from './types';

// Modular Components
import ConversationList from './components/ConversationList/ConversationList';
import ChatWindow from './components/ChatWindow/ChatWindow';
import MessageInput from './components/MessageInput/MessageInput';

// Styles
import './Messages.common.css';
import './Messages.light.css';
import './Messages.dark.css';

const Messages: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(conversations[0]?.id || null);

  const handleSendMessage = (messageText: string) => {
    if (!selectedConversationId) return;

    const newMessage: Message = {
      id: Date.now(),
      text: messageText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      sender: 'user',
    };

    const updatedConversations = conversations.map(convo => {
      if (convo.id === selectedConversationId) {
        return {
          ...convo,
          messages: [...convo.messages, newMessage],
          lastMessage: messageText,
          lastMessageTimestamp: newMessage.timestamp,
        };
      }
      return convo;
    });

    setConversations(updatedConversations);
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null;

  return (
    <div className="Messages-container">
      <ConversationList 
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
      />
      <div className="Messages-chat-area">
        <ChatWindow conversation={selectedConversation} />
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default Messages;

