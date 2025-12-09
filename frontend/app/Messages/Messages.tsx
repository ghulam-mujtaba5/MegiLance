// @AI-HINT: Messages page placeholder - displays conversation list
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { MessageSquare, Search, User } from 'lucide-react';

const Messages: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const mockConversations = [
    { id: 1, name: 'John Developer', lastMsg: 'Sure, I can start tomorrow!', time: '2m ago', unread: 2, avatar: 'JD' },
    { id: 2, name: 'Sarah Designer', lastMsg: 'The mockups are ready for review', time: '1h ago', unread: 0, avatar: 'SD' },
    { id: 3, name: 'Mike Project Manager', lastMsg: 'Let\'s schedule a call', time: '3h ago', unread: 1, avatar: 'MP' },
    { id: 4, name: 'Emily Support', lastMsg: 'Your issue has been resolved', time: '1d ago', unread: 0, avatar: 'ES' },
  ];

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: resolvedTheme === 'dark' ? '#0f172a' : '#f8fafc' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare size={28} className={resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} />
          <h1 className={`text-2xl md:text-3xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Messages
          </h1>
        </div>

        {/* Search */}
        <div className={`relative mb-6`}>
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className={`w-full pl-11 pr-4 py-3 rounded-xl border ${
              resolvedTheme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-white placeholder:text-gray-500'
                : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
            }`}
          />
        </div>

        {/* Conversations */}
        <div className={`rounded-xl overflow-hidden ${resolvedTheme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
          {mockConversations.map((conv, idx) => (
            <button
              key={conv.id}
              className={`w-full p-4 flex items-center gap-4 text-left transition-colors ${
                idx !== mockConversations.length - 1 ? 'border-b border-gray-200 dark:border-slate-700' : ''
              } ${resolvedTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-gray-50'}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
                resolvedTheme === 'dark' ? 'bg-primary-600 text-white' : 'bg-primary-100 text-primary-600'
              }`}>
                {conv.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className={`font-semibold truncate ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {conv.name}
                  </p>
                  <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{conv.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-sm truncate ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {conv.lastMsg}
                  </p>
                  {conv.unread > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-primary-600 text-white rounded-full">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Messages;
