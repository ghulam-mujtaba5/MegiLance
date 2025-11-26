// @AI-HINT: Time Entry Detail Page - View and edit individual time entries
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import commonStyles from './TimeEntryDetail.common.module.css';
import lightStyles from './TimeEntryDetail.light.module.css';
import darkStyles from './TimeEntryDetail.dark.module.css';

interface TimeEntry {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  taskDescription: string;
  startTime: string;
  endTime: string;
  duration: number;
  hourlyRate: number;
  totalAmount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  notes?: string;
  screenshots?: { url: string; timestamp: string }[];
  activityLevel?: number;
  keystrokes?: number;
  mouseClicks?: number;
  createdAt: string;
  updatedAt: string;
}

export default function TimeEntryDetailPage() {
  const { resolvedTheme } = useTheme();
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [entry, setEntry] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  useEffect(() => {
    setMounted(true);
    fetchTimeEntry();
  }, [params.id]);

  const fetchTimeEntry = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockEntry: TimeEntry = {
        id: params.id as string,
        projectId: 'proj_001',
        projectName: 'E-commerce Website Development',
        clientName: 'TechCorp Inc.',
        taskDescription: 'Frontend development - Shopping cart implementation',
        startTime: '2025-01-25T09:00:00Z',
        endTime: '2025-01-25T17:30:00Z',
        duration: 8.5,
        hourlyRate: 75,
        totalAmount: 637.50,
        status: 'approved',
        notes: 'Completed shopping cart functionality including add/remove items, quantity updates, and persistence. Also fixed responsive layout issues.',
        screenshots: [
          { url: '/screenshots/1.png', timestamp: '2025-01-25T10:00:00Z' },
          { url: '/screenshots/2.png', timestamp: '2025-01-25T12:00:00Z' },
          { url: '/screenshots/3.png', timestamp: '2025-01-25T14:00:00Z' },
          { url: '/screenshots/4.png', timestamp: '2025-01-25T16:00:00Z' }
        ],
        activityLevel: 87,
        keystrokes: 4520,
        mouseClicks: 890,
        createdAt: '2025-01-25T09:00:00Z',
        updatedAt: '2025-01-25T17:35:00Z'
      };

      setEntry(mockEntry);
      setEditedNotes(mockEntry.notes || '');
    } catch (error) {
      console.error('Failed to fetch time entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const handleSaveNotes = async () => {
    if (!entry) return;
    // API call would go here
    setEntry({ ...entry, notes: editedNotes });
    setEditing(false);
  };

  const getStatusClass = (status: string) => {
    return commonStyles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`];
  };

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading time entry...</div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={cn(commonStyles.notFound, themeStyles.notFound)}>
          <h2>Time entry not found</h2>
          <button onClick={() => router.back()}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <button 
          className={cn(commonStyles.backButton, themeStyles.backButton)}
          onClick={() => router.back()}
        >
          ← Back to Time Tracking
        </button>
        <div className={commonStyles.headerActions}>
          {entry.status === 'draft' && (
            <button className={cn(commonStyles.submitButton, themeStyles.submitButton)}>
              Submit for Review
            </button>
          )}
          <button className={cn(commonStyles.downloadButton, themeStyles.downloadButton)}>
            Download Report
          </button>
        </div>
      </div>

      <div className={commonStyles.content}>
        {/* Main Info Card */}
        <div className={cn(commonStyles.mainCard, themeStyles.mainCard)}>
          <div className={commonStyles.cardHeader}>
            <div>
              <h1 className={cn(commonStyles.projectName, themeStyles.projectName)}>
                {entry.projectName}
              </h1>
              <p className={cn(commonStyles.clientName, themeStyles.clientName)}>
                {entry.clientName}
              </p>
            </div>
            <span className={cn(commonStyles.statusBadge, getStatusClass(entry.status))}>
              {entry.status}
            </span>
          </div>

          <div className={cn(commonStyles.taskDescription, themeStyles.taskDescription)}>
            {entry.taskDescription}
          </div>

          <div className={commonStyles.timeInfo}>
            <div className={commonStyles.timeBlock}>
              <span className={cn(commonStyles.timeLabel, themeStyles.timeLabel)}>Start Time</span>
              <span className={cn(commonStyles.timeValue, themeStyles.timeValue)}>
                {new Date(entry.startTime).toLocaleString()}
              </span>
            </div>
            <div className={commonStyles.timeBlock}>
              <span className={cn(commonStyles.timeLabel, themeStyles.timeLabel)}>End Time</span>
              <span className={cn(commonStyles.timeValue, themeStyles.timeValue)}>
                {new Date(entry.endTime).toLocaleString()}
              </span>
            </div>
            <div className={commonStyles.timeBlock}>
              <span className={cn(commonStyles.timeLabel, themeStyles.timeLabel)}>Duration</span>
              <span className={cn(commonStyles.timeValue, themeStyles.timeValue, commonStyles.highlight)}>
                {formatDuration(entry.duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={commonStyles.statsGrid}>
          <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <div className={cn(commonStyles.statIcon, themeStyles.statIcon)}>💰</div>
            <div className={commonStyles.statContent}>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Hourly Rate</span>
              <span className={cn(commonStyles.statValue, themeStyles.statValue)}>${entry.hourlyRate}/hr</span>
            </div>
          </div>
          <div className={cn(commonStyles.statCard, themeStyles.statCard, commonStyles.statHighlight)}>
            <div className={cn(commonStyles.statIcon, themeStyles.statIcon)}>💵</div>
            <div className={commonStyles.statContent}>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Amount</span>
              <span className={cn(commonStyles.statValue, themeStyles.statValue)}>${entry.totalAmount.toFixed(2)}</span>
            </div>
          </div>
          {entry.activityLevel && (
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIcon)}>📊</div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Activity Level</span>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{entry.activityLevel}%</span>
              </div>
            </div>
          )}
          {entry.keystrokes && (
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIcon)}>⌨️</div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Keystrokes</span>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{entry.keystrokes.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className={cn(commonStyles.notesCard, themeStyles.notesCard)}>
          <div className={commonStyles.notesHeader}>
            <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Work Notes</h3>
            {!editing && entry.status === 'draft' && (
              <button 
                className={cn(commonStyles.editButton, themeStyles.editButton)}
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
            )}
          </div>
          {editing ? (
            <div className={commonStyles.editingSection}>
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className={cn(commonStyles.textarea, themeStyles.textarea)}
                rows={4}
              />
              <div className={commonStyles.editActions}>
                <button 
                  className={cn(commonStyles.cancelButton, themeStyles.cancelButton)}
                  onClick={() => { setEditing(false); setEditedNotes(entry.notes || ''); }}
                >
                  Cancel
                </button>
                <button 
                  className={cn(commonStyles.saveButton, themeStyles.saveButton)}
                  onClick={handleSaveNotes}
                >
                  Save Notes
                </button>
              </div>
            </div>
          ) : (
            <p className={cn(commonStyles.notesText, themeStyles.notesText)}>
              {entry.notes || 'No notes added'}
            </p>
          )}
        </div>

        {/* Screenshots Section */}
        {entry.screenshots && entry.screenshots.length > 0 && (
          <div className={cn(commonStyles.screenshotsCard, themeStyles.screenshotsCard)}>
            <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
              Activity Screenshots ({entry.screenshots.length})
            </h3>
            <div className={commonStyles.screenshotsGrid}>
              {entry.screenshots.map((screenshot, idx) => (
                <div key={idx} className={cn(commonStyles.screenshotItem, themeStyles.screenshotItem)}>
                  <div className={commonStyles.screenshotPlaceholder}>
                    📷 Screenshot {idx + 1}
                  </div>
                  <span className={cn(commonStyles.screenshotTime, themeStyles.screenshotTime)}>
                    {new Date(screenshot.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className={cn(commonStyles.metaCard, themeStyles.metaCard)}>
          <div className={commonStyles.metaItem}>
            <span className={cn(commonStyles.metaLabel, themeStyles.metaLabel)}>Entry ID</span>
            <span className={cn(commonStyles.metaValue, themeStyles.metaValue)}>{entry.id}</span>
          </div>
          <div className={commonStyles.metaItem}>
            <span className={cn(commonStyles.metaLabel, themeStyles.metaLabel)}>Created</span>
            <span className={cn(commonStyles.metaValue, themeStyles.metaValue)}>
              {new Date(entry.createdAt).toLocaleString()}
            </span>
          </div>
          <div className={commonStyles.metaItem}>
            <span className={cn(commonStyles.metaLabel, themeStyles.metaLabel)}>Last Updated</span>
            <span className={cn(commonStyles.metaValue, themeStyles.metaValue)}>
              {new Date(entry.updatedAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
