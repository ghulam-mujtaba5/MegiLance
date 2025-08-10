// @AI-HINT: This is the Messages page, designed with a three-column layout for a premium, real-time chat experience, similar to platforms like Slack or Discord.

'use client'

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { User, Search, Paperclip, Send, Star } from 'lucide-react';
import styles from './Messages.module.css';

// AI-HINT: Mock data for the conversation list. In a real application, this would come from a real-time database or API.
const conversations = [
  {
    id: 1,
    name: 'Alice Johnson',
    lastMessage: 'Perfect, I will review the new designs by EOD.',
    timestamp: '10:42 AM',
    unread: 2,
    avatar: '/avatars/avatar-1.png', // Placeholder path
  },
  {
    id: 2,
    name: 'Project Phoenix Team',
    lastMessage: 'Just a reminder: stand-up is at 9:30 AM tomorrow.',
    timestamp: 'Yesterday',
    unread: 0,
    avatar: '/avatars/avatar-group.png',
  },
  {
    id: 3,
    name: 'Markus Lee',
    lastMessage: 'Can you send over the invoice? Thanks!',
    timestamp: '3 days ago',
    unread: 0,
    avatar: '/avatars/avatar-2.png',
  },
];

const MessagesPage = () => {
  const [activeId, setActiveId] = useState<number>(1);
  const [query, setQuery] = useState('');
  const [showUnread, setShowUnread] = useState(false);
  const [showStarred, setShowStarred] = useState(false);
  const [typing, setTyping] = useState(true);
  const [starred, setStarred] = useState<Record<number, boolean>>({ 1: true });
  const presence: Record<number, 'online' | 'offline'> = { 1: 'online', 2: 'offline', 3: 'online' };

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter(c => {
      if (showUnread && c.unread === 0) return false;
      if (showStarred && !starred[c.id]) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q);
    });
  }, [query, showUnread, showStarred, starred]);

  const activeConvo = conversations.find(c => c.id === activeId) || conversations[0];

  const toggleStar = (id: number) => setStarred(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className={styles.messagesContainer}>
      {/* Column 1: Conversation List */}
      <div className={styles.conversationList}>
        <div className={styles.listHeader}>
          <h2>Messages</h2>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search messages..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Search conversations"
            />
          </div>
          <div className={styles.filterBar}>
            <button
              className={`${styles.filterButton} ${showUnread ? styles.filterButtonActive : ''}`}
              onClick={() => setShowUnread(v => !v)}
            >Unread</button>
            <button
              className={`${styles.filterButton} ${showStarred ? styles.filterButtonActive : ''}`}
              onClick={() => setShowStarred(v => !v)}
            >Starred</button>
          </div>
        </div>
        <div className={styles.conversations}>
          {filteredConversations.length === 0 ? (
            <div className={styles.emptyState}>
              <h4>No conversations found</h4>
              <p>Try adjusting search or filters.</p>
            </div>
          ) : filteredConversations.map((convo) => (
            <div
              key={convo.id}
              className={`${styles.convoItem} ${convo.id === activeId ? styles.active : ''}`}
              onClick={() => setActiveId(convo.id)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveId(convo.id);
                }
              }}
            >
              <div className={styles.avatarWrap}>
                <Image src={convo.avatar} alt={convo.name} className={styles.avatar} width={48} height={48} />
                <span className={`${styles.presenceDot} ${styles[presence[convo.id]]}`}></span>
              </div>
              <div className={styles.convoDetails}>
                <div className={styles.convoHeader}>
                  <span className={styles.convoName}>{convo.name}</span>
                  <div className={styles.convoActions}>
                    <button
                      className={styles.iconButton}
                      title={starred[convo.id] ? 'Unstar' : 'Star'}
                      onClick={(e) => { e.stopPropagation(); toggleStar(convo.id); }}
                      aria-label={starred[convo.id] ? 'Unstar conversation' : 'Star conversation'}
                    >
                      <Star size={16} color={starred[convo.id] ? 'var(--color-primary)' : 'var(--color-text-secondary)'} fill={starred[convo.id] ? 'var(--color-primary)' : 'none'} />
                    </button>
                    <span className={styles.convoTimestamp}>{convo.timestamp}</span>
                  </div>
                </div>
                <p className={styles.lastMessage}>{convo.lastMessage}</p>
              </div>
              {convo.unread > 0 && <div className={styles.unreadBadge}>{convo.unread}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Column 2: Chat Window */}
      <div className={styles.chatWindow}>
        <div className={styles.chatHeader}>
          <h3>{activeConvo?.name}</h3>
          <p>{presence[activeConvo.id] === 'online' ? 'Online' : 'Offline'}</p>
        </div>
        <div className={styles.messageArea}>
          {/* AI-HINT: Messages would be rendered here from a state object. */}
          <div className={`${styles.message} ${styles.received}`}><p>Hey, I&apos;ve pushed the latest wireframes to the Figma project. Let me know your thoughts!</p></div>
          <div className={`${styles.message} ${styles.sent}`}><p>Awesome, thanks! Taking a look now.</p></div>
          <div className={`${styles.message} ${styles.received}`}><p>Perfect, I will review the new designs by EOD.</p></div>
          {typing && (
            <div className={styles.typingIndicator} aria-live="polite">
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
            </div>
          )}
        </div>
        <div className={styles.chatInputArea}>
          <button className={styles.iconButton} title="Attach file">
            <Paperclip size={20} />
          </button>
          <input type="text" placeholder="Type a message..." className={styles.chatInput} />
          <button className={`${styles.iconButton} ${styles.sendButton}`} title="Send message">
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Column 3: Details Panel */}
      <div className={styles.detailsPanel}>
        <div className={styles.panelHeader}>
          <Image src={activeConvo?.avatar || '/avatars/avatar-1.png'} alt={activeConvo?.name || 'User'} className={styles.panelAvatar} width={80} height={80} />
          <h3>{activeConvo?.name}</h3>
          <p>{presence[activeConvo.id] === 'online' ? 'Online' : 'Offline'}</p>
        </div>
        <div className={styles.panelSection}>
          <h4><User size={16} /> About</h4>
          <p>Lead UI/UX Designer at Innovate Inc. Passionate about creating intuitive and beautiful user experiences.</p>
        </div>
        <div className={styles.panelSection}>
          <h4><Paperclip size={16} /> Shared Files</h4>
          {/* AI-HINT: A list of shared files would be rendered here. */}
          <p>No files shared yet.</p>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
