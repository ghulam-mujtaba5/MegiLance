// @AI-HINT: This file defines the centralized TypeScript types for the Messages feature. Using dedicated type definitions improves code clarity, maintainability, and type safety across all related components.

export interface Message {
  id: number;
  text: string;
  timestamp: string;
  sender: 'user' | 'contact'; // 'user' for outgoing, 'contact' for incoming
  avatarUrl?: string; // Optional avatar for the sender
}

export interface Conversation {
  id: number;
  contactName: string;
  contactAvatarUrl?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount?: number; // Optional unread message indicator
  messages: Message[];
}
