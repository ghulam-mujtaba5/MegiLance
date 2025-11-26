// @AI-HINT: This is the AI Chatbot page, providing an interactive assistant. All styles are per-component only.
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';

import commonStyles from './Chatbot.common.module.css';
import lightStyles from './Chatbot.light.module.css';
import darkStyles from './Chatbot.dark.module.css';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const Chatbot: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Hello! How can I help you today?', sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  if (!resolvedTheme) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Mock bot response
    setTimeout(() => {
      const botResponse: Message = { id: Date.now() + 1, text: 'Thanks for your message! I am a demo chatbot. I will be able to answer your questions soon.', sender: 'bot' };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={cn(commonStyles.chatContainer, themeStyles.chatContainer)}>
        <header className={cn(commonStyles.header, themeStyles.header)}>
          <h2 className={commonStyles.headerTitle}>AI Assistant</h2>
          <div className={cn(commonStyles.statusIndicator, themeStyles.statusIndicator)}>● Online</div>
        </header>
        <div className={commonStyles.messages}>
          {messages.map(msg => (
            <div 
              key={msg.id} 
              className={cn(
                commonStyles.message,
                msg.sender === 'user' ? commonStyles.messageUser : commonStyles.messageBot
              )}
            >
              {msg.sender === 'bot' && <UserAvatar name="AI Assistant" src="/ai-avatar.png" size="small" />}
              <div className={cn(
                commonStyles.messageBubble,
                msg.sender === 'user' ? themeStyles.messageBubbleUser : themeStyles.messageBubbleBot
              )}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form className={cn(commonStyles.inputForm, themeStyles.inputForm)} onSubmit={handleSend}>
          <input
            type="text"
            className={cn(commonStyles.input, themeStyles.input)}
            placeholder="Ask a question..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <Button variant="primary" type="submit">Send</Button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
