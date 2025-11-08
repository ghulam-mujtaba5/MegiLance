// @AI-HINT: This component provides a fully theme-aware chat interface for interacting with an AI agent. It uses per-component CSS modules and the cn utility for robust, maintainable styling.
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Button from '@/app/components/Button/Button';
import { MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import commonStyles from './ChatbotAgent.common.module.css';
import lightStyles from './ChatbotAgent.light.module.css';
import darkStyles from './ChatbotAgent.dark.module.css';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const ChatbotAgent: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Hello! How can I help you with your project today?', sender: 'bot' },
    { id: 2, text: 'I need to find a developer skilled in Next.js and Web3.', sender: 'user' },
  ]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;

    const newUserMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
    };

    setMessages([...messages, newUserMessage]);
    setInputValue('');

    // Mock bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: 'Searching for top-rated Next.js and Web3 developers for you...',
        sender: 'bot',
      };
      setMessages(prevMessages => [...prevMessages, botResponse]);
    }, 1000);
  };

  if (!mounted) {
    return (
      <div className={commonStyles.chatbotContainer}>
        <button
          className={cn(commonStyles.toggleButton, lightStyles.toggleButton)}
          aria-label="Loading chat"
          disabled
        >
          <MessageSquare size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className={commonStyles.chatbotContainer}>
      {isOpen && (
        <div className={cn(commonStyles.chatbotAgent, themeStyles.chatbotAgent)}>
          <div className={cn(commonStyles.chatbotAgentMessages, themeStyles.chatbotAgentMessages)}>
            {messages.map(message => (
              <div key={message.id} className={cn(
                commonStyles.message,
                message.sender === 'bot'
                  ? themeStyles.messageBot
                  : themeStyles.messageUser
              )}>
                <p>{message.text}</p>
              </div>
            ))}
          </div>
          <form className={cn(commonStyles.chatbotAgentInputForm, themeStyles.chatbotAgentInputForm)} onSubmit={handleSendMessage}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything..."
              className={cn(commonStyles.chatbotAgentInput, themeStyles.chatbotAgentInput)}
            />
            <Button type="submit" variant="primary">Send</Button>
          </form>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(commonStyles.toggleButton, themeStyles.toggleButton)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

export default ChatbotAgent;
