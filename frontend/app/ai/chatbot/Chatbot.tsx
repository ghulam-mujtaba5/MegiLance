// @AI-HINT: Premium AI Chatbot page with billion-dollar quality UI/UX. Features glass morphism, typing indicators, suggestions, and smooth animations.
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Send, Sparkles, MoreVertical, Trash2, Settings, Paperclip } from 'lucide-react';
import Button from '@/app/components/Button/Button';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';

import commonStyles from './Chatbot.common.module.css';
import lightStyles from './Chatbot.light.module.css';
import darkStyles from './Chatbot.dark.module.css';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const SUGGESTIONS = [
  'How do I find freelancers?',
  'What are payment methods?',
  'How to post a project?',
  'Explain escrow protection',
];

const Chatbot: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      text: 'Hello! I\'m MegiLance AI, your intelligent assistant. How can I help you today?', 
      sender: 'bot',
      timestamp: new Date()
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  if (!resolvedTheme) return null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (trimmedInput === '') return;

    const userMessage: Message = { 
      id: Date.now(), 
      text: trimmedInput, 
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowSuggestions(false);
    setIsTyping(true);

    // Simulate AI thinking time
    const thinkingTime = Math.random() * 1500 + 1000;
    
    setTimeout(() => {
      setIsTyping(false);
      const responses = [
        'I understand your question. Let me help you with that. MegiLance offers a comprehensive platform for both freelancers and clients.',
        'That\'s a great question! Our platform provides secure escrow payments, verified freelancer profiles, and AI-powered matching.',
        'I\'d be happy to assist you with that. You can navigate to your dashboard to access all project management features.',
        'Based on your query, I recommend checking out our Help Center for detailed guides, or I can walk you through the process step by step.',
        'Thanks for reaching out! Our team has designed the platform to make your freelancing or hiring experience as smooth as possible.',
      ];
      
      const botResponse: Message = { 
        id: Date.now() + 1, 
        text: responses[Math.floor(Math.random() * responses.length)], 
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, thinkingTime);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const handleClearChat = () => {
    setMessages([{
      id: Date.now(),
      text: 'Chat cleared. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }]);
    setShowSuggestions(true);
  };

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={cn(commonStyles.chatContainer, themeStyles.chatContainer)}>
            {/* Header */}
            <header className={cn(commonStyles.header, themeStyles.header)}>
              <div className={commonStyles.headerLeft}>
                <div className={cn(commonStyles.aiAvatar, themeStyles.aiAvatar)}>
                  <Sparkles size={24} />
                </div>
                <div className={commonStyles.headerInfo}>
                  <h2>MegiLance AI</h2>
                  <p className={cn(commonStyles.headerSubtext, themeStyles.headerSubtext)}>
                    <span className={cn(commonStyles.statusDot, themeStyles.statusDot)} />
                    Online • Ready to help
                  </p>
                </div>
              </div>
              <div className={commonStyles.headerActions}>
                <button 
                  className={cn(commonStyles.iconButton, themeStyles.iconButton)}
                  onClick={handleClearChat}
                  title="Clear chat"
                  aria-label="Clear chat history"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  className={cn(commonStyles.iconButton, themeStyles.iconButton)}
                  title="Settings"
                  aria-label="Chat settings"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </header>

            {/* Messages */}
            <div className={commonStyles.messages} role="log" aria-live="polite" aria-label="Chat messages">
              <AnimatePresence initial={false}>
                {messages.map(msg => (
                  <motion.div 
                    key={msg.id} 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      commonStyles.message,
                      msg.sender === 'user' ? commonStyles.messageUser : commonStyles.messageBot
                    )}
                  >
                    {msg.sender === 'bot' && (
                      <div className={cn(commonStyles.messageAvatar, themeStyles.messageAvatar)}>
                        <Sparkles size={16} />
                      </div>
                    )}
                    <div>
                      <div className={cn(
                        commonStyles.messageBubble,
                        msg.sender === 'user' ? themeStyles.messageBubbleUser : themeStyles.messageBubbleBot
                      )}>
                        {msg.text}
                      </div>
                      <span className={cn(commonStyles.messageTime, themeStyles.messageTime)}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Typing Indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(commonStyles.message, commonStyles.messageBot)}
                  >
                    <div className={cn(commonStyles.messageAvatar, themeStyles.messageAvatar)}>
                      <Sparkles size={16} />
                    </div>
                    <div className={cn(commonStyles.typingIndicator, themeStyles.typingIndicator)}>
                      <div className={commonStyles.typingDots}>
                        <span className={cn(commonStyles.typingDot, themeStyles.typingDot)} />
                        <span className={cn(commonStyles.typingDot, themeStyles.typingDot)} />
                        <span className={cn(commonStyles.typingDot, themeStyles.typingDot)} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {showSuggestions && messages.length <= 2 && (
              <div className={commonStyles.suggestions}>
                {SUGGESTIONS.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(commonStyles.suggestionChip, themeStyles.suggestionChip)}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form 
              className={cn(commonStyles.inputForm, themeStyles.inputForm)} 
              onSubmit={handleSend}
            >
              <input
                ref={inputRef}
                type="text"
                className={cn(commonStyles.input, themeStyles.input)}
                placeholder="Ask me anything about MegiLance..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={isTyping}
                aria-label="Type your message"
              />
              <button 
                type="submit" 
                className={cn(commonStyles.sendButton, themeStyles.sendButton)}
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
};

export default Chatbot;
