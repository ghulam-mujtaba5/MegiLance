// @AI-HINT: Admin Feedback Dashboard - User feedback collection and analysis
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './Feedback.common.module.css';
import lightStyles from './Feedback.light.module.css';
import darkStyles from './Feedback.dark.module.css';

interface FeedbackItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userType: 'freelancer' | 'client';
  type: 'bug' | 'feature' | 'improvement' | 'complaint' | 'praise';
  category: string;
  subject: string;
  message: string;
  rating?: number;
  status: 'new' | 'in_review' | 'addressed' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt?: string;
  response?: string;
  attachments?: string[];
}

interface FeedbackStats {
  totalFeedback: number;
  newToday: number;
  avgRating: number;
  responseRate: number;
  byType: { type: string; count: number }[];
}

export default function AdminFeedbackPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'in_review' | 'addressed'>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [responseText, setResponseText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    setMounted(true);
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const mockFeedback: FeedbackItem[] = [
        { id: 'f1', userId: 'u1', userName: 'John Smith', userEmail: 'john@example.com', userType: 'freelancer', type: 'feature', category: 'Payments', subject: 'Add cryptocurrency payments', message: 'It would be great to have Bitcoin and Ethereum payment options for international freelancers.', status: 'new', priority: 'medium', createdAt: '2025-01-25T10:00:00Z' },
        { id: 'f2', userId: 'u2', userName: 'Sarah Johnson', userEmail: 'sarah@example.com', userType: 'client', type: 'bug', category: 'Messaging', subject: 'Messages not loading properly', message: 'Sometimes when I open a conversation, the messages take forever to load or don\'t load at all.', rating: 2, status: 'in_review', priority: 'high', createdAt: '2025-01-24T15:30:00Z', updatedAt: '2025-01-25T09:00:00Z' },
        { id: 'f3', userId: 'u3', userName: 'Mike Wilson', userEmail: 'mike@example.com', userType: 'freelancer', type: 'praise', category: 'General', subject: 'Love the new dashboard!', message: 'The recent update to the dashboard is fantastic. Much easier to navigate and find what I need.', rating: 5, status: 'addressed', priority: 'low', createdAt: '2025-01-23T12:00:00Z', response: 'Thank you for the kind words! We\'re glad you\'re enjoying the new dashboard.' },
        { id: 'f4', userId: 'u4', userName: 'Emily Davis', userEmail: 'emily@example.com', userType: 'client', type: 'improvement', category: 'Search', subject: 'Better filtering options', message: 'The freelancer search could use more advanced filters like specific tools they use, timezone, etc.', status: 'new', priority: 'medium', createdAt: '2025-01-22T08:45:00Z' },
        { id: 'f5', userId: 'u5', userName: 'Alex Chen', userEmail: 'alex@example.com', userType: 'freelancer', type: 'complaint', category: 'Support', subject: 'Slow support response time', message: 'I submitted a ticket 3 days ago and haven\'t received any response yet. This is affecting my work.', rating: 1, status: 'in_review', priority: 'critical', createdAt: '2025-01-21T14:20:00Z' }
      ];

      const mockStats: FeedbackStats = {
        totalFeedback: 247,
        newToday: 12,
        avgRating: 4.2,
        responseRate: 87,
        byType: [
          { type: 'feature', count: 89 },
          { type: 'bug', count: 56 },
          { type: 'improvement', count: 48 },
          { type: 'praise', count: 35 },
          { type: 'complaint', count: 19 }
        ]
      };

      setFeedbackItems(mockFeedback);
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return '🐛';
      case 'feature': return '💡';
      case 'improvement': return '📈';
      case 'complaint': return '😤';
      case 'praise': return '🌟';
      default: return '📝';
    }
  };

  const getPriorityClass = (priority: string) => {
    return commonStyles[`priority${priority.charAt(0).toUpperCase() + priority.slice(1)}`];
  };

  const getStatusClass = (status: string) => {
    return commonStyles[`status${status.charAt(0).toUpperCase() + status.slice(1).replace('_', '')}`];
  };

  const handleRespond = async () => {
    if (!selectedFeedback || !responseText.trim()) return;
    // API call would go here
    setFeedbackItems(prev => prev.map(f => 
      f.id === selectedFeedback.id 
        ? { ...f, status: 'addressed', response: responseText, updatedAt: new Date().toISOString() }
        : f
    ));
    setResponseText('');
    setSelectedFeedback(null);
  };

  const filteredFeedback = feedbackItems.filter(f => {
    if (activeTab !== 'all' && f.status !== activeTab) return false;
    if (typeFilter !== 'all' && f.type !== typeFilter) return false;
    return true;
  });

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>User Feedback</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Review and respond to user feedback to improve the platform
          </p>
        </div>
        <button className={cn(commonStyles.exportButton, themeStyles.exportButton)}>
          Export Report
        </button>
      </div>

      {loading ? (
        <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading feedback...</div>
      ) : (
        <>
          {/* Stats */}
          {stats && (
            <div className={commonStyles.statsGrid}>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.totalFeedback}</div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Feedback</div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.newToday}</div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>New Today</div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.avgRating.toFixed(1)}</div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Avg Rating</div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.responseRate}%</div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Response Rate</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className={cn(commonStyles.filters, themeStyles.filters)}>
            <div className={commonStyles.tabs}>
              {[
                { value: 'all', label: 'All' },
                { value: 'new', label: 'New' },
                { value: 'in_review', label: 'In Review' },
                { value: 'addressed', label: 'Addressed' }
              ].map(tab => (
                <button
                  key={tab.value}
                  className={cn(commonStyles.tab, themeStyles.tab, activeTab === tab.value && commonStyles.tabActive, activeTab === tab.value && themeStyles.tabActive)}
                  onClick={() => setActiveTab(tab.value as typeof activeTab)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={cn(commonStyles.select, themeStyles.select)}
            >
              <option value="all">All Types</option>
              <option value="bug">Bugs</option>
              <option value="feature">Features</option>
              <option value="improvement">Improvements</option>
              <option value="complaint">Complaints</option>
              <option value="praise">Praise</option>
            </select>
          </div>

          {/* Feedback List */}
          <div className={commonStyles.feedbackList}>
            {filteredFeedback.map(feedback => (
              <div 
                key={feedback.id} 
                className={cn(commonStyles.feedbackCard, themeStyles.feedbackCard)}
                onClick={() => setSelectedFeedback(feedback)}
              >
                <div className={commonStyles.feedbackHeader}>
                  <div className={commonStyles.feedbackType}>
                    <span className={commonStyles.typeIcon}>{getTypeIcon(feedback.type)}</span>
                    <span className={cn(commonStyles.typeBadge, themeStyles.typeBadge)}>{feedback.type}</span>
                  </div>
                  <div className={commonStyles.feedbackMeta}>
                    <span className={cn(commonStyles.priorityBadge, getPriorityClass(feedback.priority))}>
                      {feedback.priority}
                    </span>
                    <span className={cn(commonStyles.statusBadge, getStatusClass(feedback.status))}>
                      {feedback.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <h3 className={cn(commonStyles.feedbackSubject, themeStyles.feedbackSubject)}>
                  {feedback.subject}
                </h3>
                <p className={cn(commonStyles.feedbackMessage, themeStyles.feedbackMessage)}>
                  {feedback.message.substring(0, 150)}...
                </p>
                <div className={cn(commonStyles.feedbackFooter, themeStyles.feedbackFooter)}>
                  <div className={commonStyles.userInfo}>
                    <span className={cn(commonStyles.userName, themeStyles.userName)}>{feedback.userName}</span>
                    <span className={cn(commonStyles.userType, themeStyles.userType)}>({feedback.userType})</span>
                  </div>
                  <span className={cn(commonStyles.feedbackDate, themeStyles.feedbackDate)}>
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {feedback.rating && (
                  <div className={commonStyles.feedbackRating}>
                    {'⭐'.repeat(feedback.rating)}{'☆'.repeat(5 - feedback.rating)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Detail Modal */}
          {selectedFeedback && (
            <div className={commonStyles.modalOverlay} onClick={() => setSelectedFeedback(null)}>
              <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
                <div className={commonStyles.modalHeader}>
                  <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>
                    {selectedFeedback.subject}
                  </h2>
                  <button className={commonStyles.closeButton} onClick={() => setSelectedFeedback(null)}>×</button>
                </div>
                <div className={commonStyles.modalContent}>
                  <div className={commonStyles.detailRow}>
                    <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>From:</span>
                    <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>
                      {selectedFeedback.userName} ({selectedFeedback.userEmail})
                    </span>
                  </div>
                  <div className={commonStyles.detailRow}>
                    <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Category:</span>
                    <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>{selectedFeedback.category}</span>
                  </div>
                  <div className={cn(commonStyles.messageBox, themeStyles.messageBox)}>
                    <p>{selectedFeedback.message}</p>
                  </div>
                  {selectedFeedback.response && (
                    <div className={cn(commonStyles.responseBox, themeStyles.responseBox)}>
                      <h4>Response:</h4>
                      <p>{selectedFeedback.response}</p>
                    </div>
                  )}
                  {selectedFeedback.status !== 'addressed' && selectedFeedback.status !== 'closed' && (
                    <div className={commonStyles.respondSection}>
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Type your response..."
                        className={cn(commonStyles.textarea, themeStyles.textarea)}
                        rows={4}
                      />
                      <button 
                        className={cn(commonStyles.respondButton, themeStyles.respondButton)}
                        onClick={handleRespond}
                        disabled={!responseText.trim()}
                      >
                        Send Response
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
