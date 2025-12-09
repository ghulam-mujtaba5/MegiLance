// @AI-HINT: Admin Content Moderation page
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import Loading from '@/app/components/Loading/Loading';
import { ShieldAlert, Check, X, Eye, AlertTriangle, Flag, MessageSquare, FileText } from 'lucide-react';

import commonStyles from './Moderation.common.module.css';
import lightStyles from './Moderation.light.module.css';
import darkStyles from './Moderation.dark.module.css';

interface FlaggedItem {
  id: string;
  type: 'profile' | 'project' | 'message' | 'review';
  content: string;
  reporter: string;
  reason: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function AdminModerationPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<FlaggedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    setMounted(true);
    // Simulated data for now
    setItems([
      { id: '1', type: 'profile', content: 'Suspicious profile description with potential spam links', reporter: 'john@example.com', reason: 'Spam', created_at: new Date().toISOString(), status: 'pending' },
      { id: '2', type: 'project', content: 'Project posting with inappropriate content', reporter: 'jane@example.com', reason: 'Inappropriate content', created_at: new Date().toISOString(), status: 'pending' },
      { id: '3', type: 'review', content: 'Fake review with misleading information', reporter: 'mike@example.com', reason: 'Fake review', created_at: new Date().toISOString(), status: 'pending' },
    ]);
    setLoading(false);
  }, []);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'profile': return <ShieldAlert size={18} />;
      case 'project': return <FileText size={18} />;
      case 'message': return <MessageSquare size={18} />;
      case 'review': return <Flag size={18} />;
      default: return <AlertTriangle size={18} />;
    }
  };

  const handleApprove = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, status: 'approved' as const } : item));
  };

  const handleReject = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, status: 'rejected' as const } : item));
  };

  if (!mounted) return <Loading />;

  const filteredItems = items.filter(item => filter === 'all' || item.status === filter);

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Content Moderation</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Review and moderate flagged content
          </p>
        </div>
      </div>

      <div className={commonStyles.stats}>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <AlertTriangle size={24} className={commonStyles.statIconWarning} />
          <div>
            <span className={commonStyles.statValue}>{items.filter(i => i.status === 'pending').length}</span>
            <span className={commonStyles.statLabel}>Pending Review</span>
          </div>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <Check size={24} className={commonStyles.statIconSuccess} />
          <div>
            <span className={commonStyles.statValue}>{items.filter(i => i.status === 'approved').length}</span>
            <span className={commonStyles.statLabel}>Approved</span>
          </div>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <X size={24} className={commonStyles.statIconDanger} />
          <div>
            <span className={commonStyles.statValue}>{items.filter(i => i.status === 'rejected').length}</span>
            <span className={commonStyles.statLabel}>Rejected</span>
          </div>
        </div>
      </div>

      <div className={commonStyles.filters}>
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            className={cn(commonStyles.filterBtn, filter === f && commonStyles.filterBtnActive, themeStyles.filterBtn)}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className={cn(commonStyles.itemsList, themeStyles.itemsList)}>
          {filteredItems.map(item => (
            <div key={item.id} className={cn(commonStyles.item, themeStyles.item)}>
              <div className={commonStyles.itemHeader}>
                <div className={commonStyles.itemType}>
                  {getTypeIcon(item.type)}
                  <span>{item.type}</span>
                </div>
                <span className={cn(commonStyles.statusBadge, commonStyles[`status${item.status}`])}>
                  {item.status}
                </span>
              </div>
              <p className={cn(commonStyles.itemContent, themeStyles.itemContent)}>{item.content}</p>
              <div className={commonStyles.itemMeta}>
                <span>Reported by: {item.reporter}</span>
                <span>Reason: {item.reason}</span>
              </div>
              {item.status === 'pending' && (
                <div className={commonStyles.itemActions}>
                  <Button variant="ghost" size="sm" iconBefore={<Eye size={16} />}>View</Button>
                  <Button variant="success" size="sm" iconBefore={<Check size={16} />} onClick={() => handleApprove(item.id)}>Approve</Button>
                  <Button variant="danger" size="sm" iconBefore={<X size={16} />} onClick={() => handleReject(item.id)}>Reject</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
