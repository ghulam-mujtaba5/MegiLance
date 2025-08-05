// @AI-HINT: This component renders the input form for sending a new message. It manages its own state for the message text and provides a callback when the message is sent.

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import './MessageInput.common.css';
import './MessageInput.light.css';
import './MessageInput.dark.css';

interface MessageInputProps {
  onSendMessage: (messageText: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text.trim());
      setText('');
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
      />
      <button type="submit" className="MessageInput-button" aria-label="Send message">
        <Send size={20} />
      </button>
    </form>
  );
};

export default MessageInput;
