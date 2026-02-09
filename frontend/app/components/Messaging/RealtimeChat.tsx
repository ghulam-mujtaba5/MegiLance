// @AI-HINT: Real-time chat component using WebSocket
'use client';

import { useEffect, useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useWebSocket } from '@/hooks/useWebSocket';
import { SendHorizontal, Circle } from 'lucide-react';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';

import commonStyles from './RealtimeChat.common.module.css';
import lightStyles from './RealtimeChat.light.module.css';
import darkStyles from './RealtimeChat.dark.module.css';

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  timestamp: string;
}

interface RealtimeChatProps {
  roomId: string;
  currentUserId: string;
  currentUserName: string;
}

const RealtimeChat: React.FC<RealtimeChatProps> = ({ roomId, currentUserId, currentUserName }) => {
  const { resolvedTheme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { connected, on, off, joinRoom, leaveRoom, sendMessage, send } = useWebSocket();

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    container: cn(commonStyles.container, themeStyles.container),
    header: cn(commonStyles.header, themeStyles.header),
    title: cn(commonStyles.title, themeStyles.title),
    status: cn(commonStyles.status, themeStyles.status),
    messagesContainer: cn(commonStyles.messagesContainer, themeStyles.messagesContainer),
    message: cn(commonStyles.message, themeStyles.message),
    messageOwn: cn(commonStyles.messageOwn, themeStyles.messageOwn),
    messageOther: cn(commonStyles.messageOther, themeStyles.messageOther),
    messageSender: cn(commonStyles.messageSender, themeStyles.messageSender),
    messageText: cn(commonStyles.messageText, themeStyles.messageText),
    messageTime: cn(commonStyles.messageTime, themeStyles.messageTime),
    typing: cn(commonStyles.typing, themeStyles.typing),
    inputContainer: cn(commonStyles.inputContainer, themeStyles.inputContainer),
  };

  useEffect(() => {
    if (connected) {
      joinRoom(roomId);

      // Listen for messages
      const handleMessage = (data: ChatMessage) => {
        setMessages((prev) => [...prev, data]);
      };

      // Listen for typing events
      const handleTyping = (data: { user_name: string }) => {
        if (data.user_name !== currentUserName) {
          setTypingUsers((prev) => {
            if (!prev.includes(data.user_name)) {
              return [...prev, data.user_name];
            }
            return prev;
          });
          
          // Remove typing indicator after 3 seconds
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((name) => name !== data.user_name));
          }, 3000);
        }
      };

      on('message', handleMessage);
      on('user_typing', handleTyping);

      return () => {
        off('message', handleMessage);
        off('user_typing', handleTyping);
        leaveRoom(roomId);
      };
    }
  }, [connected, roomId, currentUserName, joinRoom, leaveRoom, on, off]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    sendMessage(roomId, newMessage, {
      sender_id: currentUserId,
      sender_name: currentUserName,
    });

    setNewMessage('');
  };

  const handleTyping = () => {
    // Send typing event
    send('typing', { room: roomId, user_name: currentUserName });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      send('stop_typing', { room: roomId, user_name: currentUserName });
    }, 1000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Chat</h2>
        <div className={styles.status}>
          <Circle className={connected ? 'text-green-500' : 'text-gray-400'} size={10} fill={connected ? '#22c55e' : '#9ca3af'} />
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      <div className={styles.messagesContainer}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              styles.message,
              msg.sender_id === currentUserId ? styles.messageOwn : styles.messageOther
            )}
          >
            {msg.sender_id !== currentUserId && (
              <div className={styles.messageSender}>{msg.sender_name}</div>
            )}
            <div className={styles.messageText}>{msg.message}</div>
            <div className={styles.messageTime}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {typingUsers.length > 0 && (
          <div className={styles.typing}>
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputContainer}>
        <Input
          name="message"
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSend();
            }
          }}
          disabled={!connected}
        />
        <Button
          variant="primary"
          onClick={handleSend}
          disabled={!connected || !newMessage.trim()}
        >
          <SendHorizontal size={18} />
        </Button>
      </div>
    </div>
  );
};

export default RealtimeChat;
