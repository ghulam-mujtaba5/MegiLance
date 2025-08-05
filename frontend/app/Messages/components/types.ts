// @AI-HINT: This file defines the TypeScript types for the Messages feature.

export interface Message {
  id: number;
  text: string;
  timestamp: string;
  sender: 'user' | 'contact';
}

export interface Conversation {
  id: number;
  contactName: string;
  avatar: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  messages: Message[];
}
