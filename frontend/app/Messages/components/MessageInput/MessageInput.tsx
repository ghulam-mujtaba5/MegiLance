// @AI-HINT: This component renders the input form for sending a new message. It manages its own state for the message text and provides a callback when the message is sent.

'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import commonStyles from './MessageInput.common.module.css';
import lightStyles from './MessageInput.light.module.css';
import darkStyles from './MessageInput.dark.module.css';

interface MessageInputProps {
  conversationId: number | null;
  onMessageSent: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ conversationId, onMessageSent }) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !conversationId || isSending) {
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageText: text.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setText('');
      onMessageSent(); // Notify parent to trigger refresh
    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally, show an error to the user
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form className="MessageInput-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="MessageInput-input"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoComplete="off"
        disabled={!conversationId || isSending}
      />
      <button type="submit" className="MessageInput-button" aria-label="Send message" disabled={!conversationId || isSending}>
        <Send size={20} />
      </button>
    </form>
  );
};

export default MessageInput;
