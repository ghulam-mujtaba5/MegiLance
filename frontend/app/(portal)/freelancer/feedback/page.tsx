// @AI-HINT: User feedback page for feature requests and bug reports
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { userFeedbackApi } from '@/lib/api';
import commonStyles from './Feedback.common.module.css';
import lightStyles from './Feedback.light.module.css';
import darkStyles from './Feedback.dark.module.css';

interface FeedbackItem {
  id: string;
  type: 'feature_request' | 'bug_report' | 'improvement' | 'question';
  title: string;
  description: string;
  status: 'open' | 'under_review' | 'planned' | 'in_progress' | 'completed' | 'declined';
  votes: number;
  user_voted: boolean;
  comments_count: number;
  created_at: string;
  category: string;
}

interface FeedbackCategory {
  id: string;
  name: string;
  icon: string;
}

const feedbackTypes = [
  { type: 'feature_request', label: 'Feature Request', icon: '💡', color: '#8b5cf6' },
  { type: 'bug_report', label: 'Bug Report', icon: '🐛', color: '#ef4444' },
  { type: 'improvement', label: 'Improvement', icon: '✨', color: '#f59e0b' },
  { type: 'question', label: 'Question', icon: '❓', color: '#3b82f6' },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: '#6b7280' },
  under_review: { label: 'Under Review', color: '#f59e0b' },
  planned: { label: 'Planned', color: '#8b5cf6' },
  in_progress: { label: 'In Progress', color: '#3b82f6' },
  completed: { label: 'Completed', color: '#22c55e' },
  declined: { label: 'Declined', color: '#ef4444' },
};

const categories: FeedbackCategory[] = [
  { id: 'general', name: 'General', icon: '📌' },
  { id: 'payments', name: 'Payments', icon: '💰' },
  { id: 'projects', name: 'Projects', icon: '📁' },
  { id: 'messaging', name: 'Messaging', icon: '💬' },
  { id: 'profile', name: 'Profile', icon: '👤' },
  { id: 'search', name: 'Search', icon: '🔍' },
  { id: 'mobile', name: 'Mobile App', icon: '📱' },
  { id: 'security', name: 'Security', icon: '🔐' },
];

export default function FeedbackPage() {
  const { resolvedTheme } = useTheme();
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'votes' | 'newest' | 'status'>('votes');
  
  // New feedback form
  const [newFeedback, setNewFeedback] = useState({
    type: 'feature_request' as const,
    title: '',
    description: '',
    category: 'general',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, [activeFilter, sortBy]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { sort: sortBy };
      if (activeFilter !== 'all') {
        params.type = activeFilter;
      }
      const response = await userFeedbackApi.list(params);
      setFeedbackItems(response.items || []);
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newFeedback.title.trim() || !newFeedback.description.trim()) return;

    try {
      setSubmitting(true);
      await userFeedbackApi.create(newFeedback);
      setShowModal(false);
      setNewFeedback({
        type: 'feature_request',
        title: '',
        description: '',
        category: 'general',
      });
      loadFeedback();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (id: string, userVoted: boolean) => {
    try {
      if (userVoted) {
        await userFeedbackApi.unvote(id);
      } else {
        await userFeedbackApi.vote(id);
      }
      setFeedbackItems(prev =>
        prev.map(item =>
          item.id === id
            ? {
                ...item,
                votes: userVoted ? item.votes - 1 : item.votes + 1,
                user_voted: !userVoted,
              }
            : item
        )
      );
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const getTypeConfig = (type: string) => feedbackTypes.find(t => t.type === type) || feedbackTypes[0];

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div className={commonStyles.headerTop}>
          <div>
            <h1 className={cn(commonStyles.title, themeStyles.title)}>Feedback & Ideas</h1>
            <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
              Share your ideas, report bugs, and vote on features
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className={cn(commonStyles.submitButton, themeStyles.submitButton)}
          >
            ➕ Submit Feedback
          </button>
        </div>

        <div className={commonStyles.controls}>
          <div className={cn(commonStyles.filters, themeStyles.filters)}>
            <button
              onClick={() => setActiveFilter('all')}
              className={cn(
                commonStyles.filterButton,
                themeStyles.filterButton,
                activeFilter === 'all' && commonStyles.filterActive,
                activeFilter === 'all' && themeStyles.filterActive
              )}
            >
              All
            </button>
            {feedbackTypes.map(ft => (
              <button
                key={ft.type}
                onClick={() => setActiveFilter(ft.type)}
                className={cn(
                  commonStyles.filterButton,
                  themeStyles.filterButton,
                  activeFilter === ft.type && commonStyles.filterActive,
                  activeFilter === ft.type && themeStyles.filterActive
                )}
              >
                {ft.icon} {ft.label}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'votes' | 'newest' | 'status')}
            className={cn(commonStyles.sortSelect, themeStyles.sortSelect)}
          >
            <option value="votes">Most Voted</option>
            <option value="newest">Newest First</option>
            <option value="status">By Status</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={cn(commonStyles.loading, themeStyles.loading)}>
          Loading feedback...
        </div>
      ) : feedbackItems.length === 0 ? (
        <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
          <span className={commonStyles.emptyIcon}>💭</span>
          <h3 className={cn(commonStyles.emptyTitle, themeStyles.emptyTitle)}>
            No Feedback Yet
          </h3>
          <p className={cn(commonStyles.emptyDesc, themeStyles.emptyDesc)}>
            Be the first to share your ideas and suggestions!
          </p>
        </div>
      ) : (
        <div className={commonStyles.feedbackList}>
          {feedbackItems.map(item => {
            const typeConfig = getTypeConfig(item.type);
            const status = statusConfig[item.status];
            return (
              <div
                key={item.id}
                className={cn(commonStyles.feedbackCard, themeStyles.feedbackCard)}
              >
                <div className={commonStyles.voteSection}>
                  <button
                    onClick={() => handleVote(item.id, item.user_voted)}
                    className={cn(
                      commonStyles.voteButton,
                      themeStyles.voteButton,
                      item.user_voted && commonStyles.voted,
                      item.user_voted && themeStyles.voted
                    )}
                  >
                    ▲
                  </button>
                  <span className={cn(commonStyles.voteCount, themeStyles.voteCount)}>
                    {item.votes}
                  </span>
                </div>

                <div className={commonStyles.feedbackContent}>
                  <div className={commonStyles.feedbackMeta}>
                    <span
                      className={commonStyles.typeBadge}
                      style={{ backgroundColor: typeConfig.color }}
                    >
                      {typeConfig.icon} {typeConfig.label}
                    </span>
                    <span
                      className={commonStyles.statusBadge}
                      style={{ backgroundColor: status.color }}
                    >
                      {status.label}
                    </span>
                    <span className={cn(commonStyles.category, themeStyles.category)}>
                      {categories.find(c => c.id === item.category)?.icon}{' '}
                      {categories.find(c => c.id === item.category)?.name || item.category}
                    </span>
                  </div>

                  <h3 className={cn(commonStyles.feedbackTitle, themeStyles.feedbackTitle)}>
                    {item.title}
                  </h3>
                  <p className={cn(commonStyles.feedbackDesc, themeStyles.feedbackDesc)}>
                    {item.description.length > 200
                      ? `${item.description.slice(0, 200)}...`
                      : item.description}
                  </p>

                  <div className={commonStyles.feedbackFooter}>
                    <span className={cn(commonStyles.commentCount, themeStyles.commentCount)}>
                      💬 {item.comments_count} comments
                    </span>
                    <span className={cn(commonStyles.date, themeStyles.date)}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Modal */}
      {showModal && (
        <div className={commonStyles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={(e) => e.stopPropagation()}>
            <div className={cn(commonStyles.modalHeader, themeStyles.modalHeader)}>
              <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>
                Submit Feedback
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                disabled={submitting}
              >
                ×
              </button>
            </div>

            <div className={commonStyles.modalContent}>
              <div className={commonStyles.formGroup}>
                <label className={cn(commonStyles.label, themeStyles.label)}>Type</label>
                <div className={commonStyles.typeGrid}>
                  {feedbackTypes.map(ft => (
                    <button
                      key={ft.type}
                      type="button"
                      onClick={() => setNewFeedback(prev => ({ ...prev, type: ft.type as typeof prev.type }))}
                      className={cn(
                        commonStyles.typeOption,
                        themeStyles.typeOption,
                        newFeedback.type === ft.type && commonStyles.typeSelected,
                        newFeedback.type === ft.type && themeStyles.typeSelected
                      )}
                      style={newFeedback.type === ft.type ? { borderColor: ft.color } : undefined}
                    >
                      <span className={commonStyles.typeIcon}>{ft.icon}</span>
                      <span>{ft.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={commonStyles.formGroup}>
                <label className={cn(commonStyles.label, themeStyles.label)}>Category</label>
                <select
                  value={newFeedback.category}
                  onChange={(e) => setNewFeedback(prev => ({ ...prev, category: e.target.value }))}
                  className={cn(commonStyles.select, themeStyles.select)}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={commonStyles.formGroup}>
                <label className={cn(commonStyles.label, themeStyles.label)}>Title</label>
                <input
                  type="text"
                  value={newFeedback.title}
                  onChange={(e) => setNewFeedback(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief summary of your feedback"
                  className={cn(commonStyles.input, themeStyles.input)}
                />
              </div>

              <div className={commonStyles.formGroup}>
                <label className={cn(commonStyles.label, themeStyles.label)}>Description</label>
                <textarea
                  value={newFeedback.description}
                  onChange={(e) => setNewFeedback(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your idea, bug, or suggestion in detail..."
                  rows={5}
                  className={cn(commonStyles.textarea, themeStyles.textarea)}
                />
              </div>
            </div>

            <div className={cn(commonStyles.modalFooter, themeStyles.modalFooter)}>
              <button
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className={cn(commonStyles.cancelBtn, themeStyles.cancelBtn)}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !newFeedback.title.trim() || !newFeedback.description.trim()}
                className={cn(commonStyles.submitBtn, themeStyles.submitBtn)}
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
