// @AI-HINT: This component displays a theme-aware list of conversations. It's built with a clean separation of concerns: structural styles are in the common module, while all colors and theme-specific properties are handled by global CSS variables defined in the light and dark modules.
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import Badge from '@/app/components/Badge/Badge';
import { cn } from '@/lib/utils';
import commonStyles from './ChatInbox.common.module.css';
import lightStyles from './ChatInbox.light.module.css';
import darkStyles from './ChatInbox.dark.module.css';

interface Conversation {
  id: string;
  userName: string;
  avatarUrl: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

const mockConversations: Conversation[] = [
  { id: 'convo_001', userName: 'Bob Williams', avatarUrl: '/avatars/bob.png', lastMessage: 'Sure, I can get that done by tomorrow.', timestamp: '10:30 AM', unreadCount: 2 },
  { id: 'convo_002', userName: 'Diana Prince', avatarUrl: '/avatars/diana.png', lastMessage: 'The project files are attached.', timestamp: 'Yesterday', unreadCount: 0 },
  { id: 'convo_003', userName: 'Ethan Hunt', avatarUrl: '/avatars/ethan.png', lastMessage: 'Great work on the last milestone!', timestamp: '2 days ago', unreadCount: 0 },
  { id: 'convo_004', userName: 'Support Bot', avatarUrl: '/avatars/bot.png', lastMessage: 'How can I help you today?', timestamp: '1 week ago', unreadCount: 0 },
];

const ChatInbox: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [activeConversation, setActiveConversation] = useState('convo_001');

  if (!resolvedTheme) return null;

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={cn(commonStyles.header, themeStyles.header)}>
        <h2 className={cn(commonStyles.title, themeStyles.title)}>Inbox</h2>
      </div>
      <div className={cn(commonStyles.list, themeStyles.list)}>
        {mockConversations.map(convo => (
          <div 
            key={convo.id} 
            className={cn(
              commonStyles.item, 
              themeStyles.item, 
              activeConversation === convo.id && commonStyles.active,
              activeConversation === convo.id && themeStyles.active
            )}
            onClick={() => setActiveConversation(convo.id)}
            role="button"
            tabIndex={0}
            aria-current={activeConversation === convo.id}
          >
            <UserAvatar src={convo.avatarUrl} name={convo.userName} size="medium" />
            <div className={cn(commonStyles.itemDetails, themeStyles.itemDetails)}>
              <div className={cn(commonStyles.itemRow, themeStyles.itemRow)}>
                <span className={cn(commonStyles.userName, themeStyles.userName)}>{convo.userName}</span>
                <span className={cn(commonStyles.timestamp, themeStyles.timestamp)}>{convo.timestamp}</span>
              </div>
              <div className={cn(commonStyles.itemRow, themeStyles.itemRow)}>
                <p className={cn(commonStyles.lastMessage, themeStyles.lastMessage)}>{convo.lastMessage}</p>
                {convo.unreadCount > 0 && (
                  <Badge variant="primary">{convo.unreadCount}</Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatInbox;
