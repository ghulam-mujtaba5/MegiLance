// @AI-HINT: Real-time chat component using WebSocket with read receipts and typing indicators
'use client';

import { useEffect, useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { SendHorizontal, Circle, Check, CheckCheck } from 'lucide-react';
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
  read_by?: string[];
  read_at?: string;
}

interface RealtimeChatProps {
  roomId: string;
  conversationId: number;
  currentUserId: string;
  currentUserName: string;
  otherUserId?: number;
  otherUserName?: string;
}

const RealtimeChat: React.FC<RealtimeChatProps> = ({
  roomId,
  conversationId,
  currentUserId,
  currentUserName,
  otherUserId,
  otherUserName,
}) => {
  const { resolvedTheme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { connected, on, off, joinRoom, leaveRoom, sendMessage, sendReadReceipt } = useWebSocket();
  const { typingUsers, isAnyoneTyping, getTypingText, sendTyping, stopTyping } = useTypingIndicator(conversationId);
  const { isOnline } = useOnlineStatus(otherUserId ? [otherUserId] : []);

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

      const handleMessage = (data: ChatMessage) => {
        setMessages((prev) => [...prev, data]);
        // Send read receipt for messages from others
        if (data.sender_id !== currentUserId && data.id) {
          sendReadReceipt(parseInt(data.id), conversationId);
        }
      };

      const handleReadReceipt = (data: { message_id: string; read_by: string; read_at: string }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.message_id
              ? {
                  ...msg,
                  read_by: [...(msg.read_by || []), data.read_by],
                  read_at: data.read_at,
                }
              : msg
          )
        );
      };

      on('message', handleMessage);
      on('read_receipt', handleReadReceipt);

      return () => {
        off('message', handleMessage);
        off('read_receipt', handleReadReceipt);
        leaveRoom(roomId);
      };
    }
  }, [connected, roomId, currentUserId, conversationId, joinRoom, leaveRoom, on, off, sendReadReceipt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    sendMessage(roomId, newMessage, {
      sender_id: currentUserId,
      sender_name: currentUserName,
    });

    stopTyping(conversationId, parseInt(currentUserId));
    setNewMessage('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    sendTyping(conversationId, parseInt(currentUserId), currentUserName);
  };

  const getReadStatus = (msg: ChatMessage) => {
    if (msg.sender_id !== currentUserId) return null;
    if (msg.read_by && msg.read_by.length > 0) {
      return (
        <span title={`Read${msg.read_at ? ` at ${new Date(msg.read_at).toLocaleTimeString()}` : ''}`}>
          <CheckCheck size={14} style={{ color: '#4573df' }} />
        </span>
      );
    }
    return (
      <span title="Sent">
        <Check size={14} style={{ opacity: 0.5 }} />
      </span>
    );
  };

  const otherOnline = otherUserId ? isOnline(otherUserId) : false;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 className={styles.title}>{otherUserName || 'Chat'}</h2>
          {otherUserId && (
            <span style={{
              fontSize: 12,
              color: otherOnline ? '#22c55e' : '#9ca3af',
            }}>
              {otherOnline ? 'Online' : 'Offline'}
            </span>
          )}
        </div>
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
            <div className={styles.messageTime} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {getReadStatus(msg)}
            </div>
          </div>
        ))}
        {isAnyoneTyping && (
          <div className={styles.typing}>
            {getTypingText()}
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
          onChange={handleInputChange}
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
