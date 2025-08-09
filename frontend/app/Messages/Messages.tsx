// @AI-HINT: This is the root component for the Messages page. It assembles the modular sub-components and manages the application state for the messaging interface.
'use client';
import React, { useState } from 'react';

// Modular Components
import ConversationList from './components/ConversationList/ConversationList';
import ChatWindow from './components/ChatWindow/ChatWindow';
import MessageInput from './components/MessageInput/MessageInput';

// Styles
// Global styles are imported at the route level (page.tsx) per Next.js App Router rules.

const Messages: React.FC = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const handleMessageSent = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <div className="Messages-container">
      <ConversationList 
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
        refreshKey={refreshKey}
      />
      <div className="Messages-chat-area">
        <ChatWindow 
          conversationId={selectedConversationId} 
          refreshKey={refreshKey} 
        />
        <MessageInput 
          conversationId={selectedConversationId} 
          onMessageSent={handleMessageSent} 
        />
      </div>
    </div>
  );
};

export default Messages;

