// @AI-HINT: This component provides a fully theme-aware chat interface for interacting with an AI agent. It uses per-component CSS modules and the cn utility for robust, maintainable styling.
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import Button from '@/app/components/Button/Button';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
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

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && !conversationId) {
      startConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startConversation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/backend/api/chatbot/start', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start conversation');
      const data = await res.json();
      setConversationId(data.conversation_id);
      setMessages([{ id: 1, text: data.response, sender: 'bot' }]);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setMessages([{ 
        id: 1, 
        text: 'Hello! I am currently offline. Please try again later.', 
        sender: 'bot' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === '' || !conversationId) return;

    const userText = inputValue;
    const newUserMessage: Message = {
      id: Date.now(),
      text: userText,
      sender: 'user',
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch(`/backend/api/chatbot/${conversationId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });
      
      if (!res.ok) throw new Error('Failed to send message');
      
      const data = await res.json();
      
      const botResponse: Message = {
        id: Date.now() + 1,
        text: data.response,
        sender: 'bot',
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
          <div className={cn(commonStyles.chatbotAgentHeader, themeStyles.chatbotAgentHeader)}>
            <h3>MegiBot AI</h3>
            <button onClick={() => setIsOpen(false)} className={commonStyles.closeButton}>
              <X size={18} />
            </button>
          </div>
          
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
            {isLoading && (
              <div className={cn(commonStyles.message, themeStyles.messageBot)}>
                <Loader2 className="animate-spin" size={16} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form className={cn(commonStyles.chatbotAgentInputForm, themeStyles.chatbotAgentInputForm)} onSubmit={handleSendMessage}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything..."
              className={cn(commonStyles.chatbotAgentInput, themeStyles.chatbotAgentInput)}
              disabled={isLoading || !conversationId}
            />
            <Button 
              type="submit" 
              variant="primary" 
              size="sm"
              disabled={isLoading || !inputValue.trim() || !conversationId}
            >
              <Send size={16} />
            </Button>
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
