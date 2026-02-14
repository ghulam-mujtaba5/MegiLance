// @AI-HINT: WebSocket custom hook - manages Socket.IO connection and events
// Supports: messaging, typing indicators, user presence, notifications, read receipts
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket as SocketIOSocket } from 'socket.io-client';
import { getAuthToken } from '@/lib/api';

type Socket = SocketIOSocket;

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
}

// Typed event payloads from backend
export interface WsNewMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  timestamp: string;
}

export interface WsTypingIndicator {
  conversation_id: number;
  user_id: number;
  user_name: string;
  is_typing: boolean;
}

export interface WsUserStatus {
  user_id: number;
  status: 'online' | 'offline';
}

export interface WsNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  created_at: string;
}

export interface WsReadReceipt {
  message_id: number;
  conversation_id: number;
  read_by: number;
  read_at: string;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { url = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000', autoConnect = true } = options;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    const token = getAuthToken();
    if (!token) {
      return;
    }

    // Create socket connection
    const newSocket = io(url, {
      path: '/ws/socket.io',
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection handlers
    newSocket.on('connect', () => {
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('connect_error', () => {
      setConnected(false);
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
      socketRef.current = null;
    };
  }, [url, autoConnect]);

  const send = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, handler: (data: any) => void) => {
    socketRef.current?.on(event, handler);
  }, []);

  const off = useCallback((event: string, handler?: (data: any) => void) => {
    if (handler) {
      socketRef.current?.off(event, handler);
    } else {
      socketRef.current?.off(event);
    }
  }, []);

  const joinRoom = useCallback((room: string) => {
    send('join_room', { room });
  }, [send]);

  const leaveRoom = useCallback((room: string) => {
    send('leave_room', { room });
  }, [send]);

  const sendMessage = useCallback((room: string, message: string, metadata?: any) => {
    send('message', {
      room,
      message,
      metadata,
    });
  }, [send]);

  const sendReadReceipt = useCallback((messageId: number, conversationId: number) => {
    send('read_receipt', { message_id: messageId, conversation_id: conversationId });
  }, [send]);

  const disconnect = useCallback(() => {
    socketRef.current?.close();
    setConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    socketRef.current?.connect();
  }, []);

  return {
    socket,
    connected,
    send,
    on,
    off,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendReadReceipt,
    disconnect,
    reconnect,
  };
};
