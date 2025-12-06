// @AI-HINT: Detailed time entries tracking with reporting and analytics
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { timeEntriesApi } from '@/lib/api';
import { PageTransition, ScrollReveal, StaggerContainer, StaggerItem } from '@/app/components/Animations';
import commonStyles from './TimeEntries.common.module.css';
import lightStyles from './TimeEntries.light.module.css';
import darkStyles from './TimeEntries.dark.module.css';

interface TimeEntry {
  id: string;
  project_id: string;
  project_name: string;
  task_description: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  hourly_rate: number;
  billable: boolean;
  status: 'running' | 'paused' | 'completed' | 'approved' | 'invoiced';
  notes: string;
  tags: string[];
  created_at: string;
}

interface WeekSummary {
  total_hours: number;
  billable_hours: number;
  total_earnings: number;
  projects_worked: number;
}

interface Project {
  id: string;
  name: string;
}

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const formatTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

const statusConfig: Record<string, { label: string; color: string }> = {
  running: { label: 'Running', color: '#22c55e' },
  paused: { label: 'Paused', color: '#f59e0b' },
  completed: { label: 'Completed', color: '#3b82f6' },
  approved: { label: 'Approved', color: '#8b5cf6' },
  invoiced: { label: 'Invoiced', color: '#06b6d4' },
};

export default function TimeEntriesPage() {
  const { resolvedTheme } = useTheme();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  
  // Filters
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  
  // New entry form
  const [newEntry, setNewEntry] = useState({
    project_id: '',
    task_description: '',
    billable: true,
    notes: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedProject, selectedStatus, dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { date_range: dateRange };
      if (selectedProject !== 'all') params.project_id = selectedProject;
      if (selectedStatus !== 'all') params.status = selectedStatus;

      const [entriesRes, projectsRes, summaryRes] = await Promise.all([
        timeEntriesApi.list(params),
        timeEntriesApi.getProjects(),
        timeEntriesApi.getWeekSummary(),
      ]);

      setEntries(entriesRes.items || []);
      setProjects(projectsRes.items || []);
      setWeekSummary(summaryRes);
      
      // Check for running timer
      const running = (entriesRes.items || []).find((e: TimeEntry) => e.status === 'running');
      if (running) setActiveTimer(running);
    } catch (error) {
      console.error('Failed to load time entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTimer = async () => {
    if (!newEntry.project_id || !newEntry.task_description.trim()) return;

    try {
      const response = await timeEntriesApi.startTimer({
        project_id: newEntry.project_id,
        task_description: newEntry.task_description,
        billable: newEntry.billable,
        notes: newEntry.notes,
        tags: newEntry.tags,
      });
      setActiveTimer(response);
      setShowTimer(false);
      setNewEntry({ project_id: '', task_description: '', billable: true, notes: '', tags: [] });
      loadData();
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const stopTimer = async () => {
    if (!activeTimer) return;

    try {
      await timeEntriesApi.stopTimer(activeTimer.id);
      setActiveTimer(null);
      loadData();
    } catch (error) {
      console.error('Failed to stop timer:', error);
    }
  };

  const pauseTimer = async () => {
    if (!activeTimer) return;

    try {
      await timeEntriesApi.pauseTimer(activeTimer.id);
      setActiveTimer(prev => prev ? { ...prev, status: 'paused' } : null);
      loadData();
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  };

  const resumeTimer = async (id: string) => {
    try {
      const response = await timeEntriesApi.resumeTimer(id);
      setActiveTimer(response);
      loadData();
    } catch (error) {
      console.error('Failed to resume timer:', error);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return;

    try {
      await timeEntriesApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !newEntry.tags.includes(tagInput.trim())) {
      setNewEntry(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setNewEntry(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  // Group entries by date
  const groupedEntries = entries.reduce((acc, entry) => {
    const dateKey = formatDate(entry.created_at);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div className={commonStyles.headerTop}>
              <div>
                <h1 className={cn(commonStyles.title, themeStyles.title)}>Time Tracking</h1>
                <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                  Track your work hours and manage time entries
                </p>
              </div>
              <button
                onClick={() => setShowTimer(true)}
                disabled={!!activeTimer}
                className={cn(commonStyles.startButton, themeStyles.startButton)}
              >
                ⏱️ Start Timer
              </button>
            </div>

            {/* Week Summary */}
            {weekSummary && (
              <StaggerContainer className={cn(commonStyles.summaryGrid, themeStyles.summaryGrid)}>
                <StaggerItem>
                  <div className={cn(commonStyles.summaryCard, themeStyles.summaryCard)}>
                    <span className={commonStyles.summaryLabel}>Total Hours</span>
                    <span className={commonStyles.summaryValue}>{weekSummary.total_hours.toFixed(1)}h</span>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className={cn(commonStyles.summaryCard, themeStyles.summaryCard)}>
                    <span className={commonStyles.summaryLabel}>Billable Hours</span>
                    <span className={commonStyles.summaryValue}>{weekSummary.billable_hours.toFixed(1)}h</span>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className={cn(commonStyles.summaryCard, themeStyles.summaryCard)}>
                    <span className={commonStyles.summaryLabel}>Earnings</span>
                    <span className={commonStyles.summaryValue}>${weekSummary.total_earnings.toFixed(2)}</span>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className={cn(commonStyles.summaryCard, themeStyles.summaryCard)}>
                    <span className={commonStyles.summaryLabel}>Projects</span>
                    <span className={commonStyles.summaryValue}>{weekSummary.projects_worked}</span>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            )}

            {/* Active Timer */}
            {activeTimer && (
              <ScrollReveal>
                <div className={cn(commonStyles.activeTimer, themeStyles.activeTimer)}>
                  <div className={commonStyles.timerInfo}>
                    <span className={commonStyles.timerProject}>{activeTimer.project_name}</span>
                    <span className={cn(commonStyles.timerTask, themeStyles.timerTask)}>
                      {activeTimer.task_description}
                    </span>
                  </div>
                  <div className={commonStyles.timerDuration}>
                    {formatDuration(activeTimer.duration_minutes)}
                  </div>
                  <div className={commonStyles.timerActions}>
                    {activeTimer.status === 'running' ? (
                      <button
                        onClick={pauseTimer}
                        className={cn(commonStyles.timerBtn, commonStyles.pauseBtn, themeStyles.pauseBtn)}
                      >
                        ⏸️ Pause
                      </button>
                    ) : (
                      <button
                        onClick={() => resumeTimer(activeTimer.id)}
                        className={cn(commonStyles.timerBtn, commonStyles.resumeBtn, themeStyles.resumeBtn)}
                      >
                        ▶️ Resume
                      </button>
                    )}
                    <button
                      onClick={stopTimer}
                      className={cn(commonStyles.timerBtn, commonStyles.stopBtn, themeStyles.stopBtn)}
                    >
                      ⏹️ Stop
                    </button>
                  </div>
                </div>
              </ScrollReveal>
            )}

            {/* Filters */}
            <ScrollReveal>
              <div className={commonStyles.filters}>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                  className={cn(commonStyles.filterSelect, themeStyles.filterSelect)}
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>

                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className={cn(commonStyles.filterSelect, themeStyles.filterSelect)}
                >
                  <option value="all">All Projects</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={cn(commonStyles.filterSelect, themeStyles.filterSelect)}
                >
                  <option value="all">All Status</option>
                  {Object.entries(statusConfig).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </ScrollReveal>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading time entries...</div>
        ) : Object.keys(groupedEntries).length === 0 ? (
          <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
            <span className={commonStyles.emptyIcon}>⏰</span>
            <h3 className={cn(commonStyles.emptyTitle, themeStyles.emptyTitle)}>No Time Entries</h3>
            <p className={cn(commonStyles.emptyDesc, themeStyles.emptyDesc)}>
              Start tracking your time to see entries here
            </p>
          </div>
        ) : (
          <StaggerContainer className={commonStyles.entriesList}>
            {Object.entries(groupedEntries).map(([dateKey, dayEntries]) => (
              <StaggerItem key={dateKey} className={commonStyles.dateGroup}>
                <h3 className={cn(commonStyles.dateHeader, themeStyles.dateHeader)}>
                  {dateKey}
                  <span className={cn(commonStyles.dateDuration, themeStyles.dateDuration)}>
                    {formatDuration(dayEntries.reduce((sum, e) => sum + e.duration_minutes, 0))}
                  </span>
                </h3>
                
                {dayEntries.map(entry => (
                  <div
                    key={entry.id}
                    className={cn(commonStyles.entryCard, themeStyles.entryCard)}
                  >
                    <div className={commonStyles.entryTime}>
                      <span className={cn(commonStyles.timeRange, themeStyles.timeRange)}>
                        {formatTime(entry.start_time)}
                        {entry.end_time && ` - ${formatTime(entry.end_time)}`}
                      </span>
                      <span className={cn(commonStyles.duration, themeStyles.duration)}>
                        {formatDuration(entry.duration_minutes)}
                      </span>
                    </div>

                    <div className={commonStyles.entryContent}>
                      <div className={commonStyles.entryHeader}>
                        <span className={cn(commonStyles.projectName, themeStyles.projectName)}>
                          {entry.project_name}
                        </span>
                        <span
                          className={commonStyles.statusBadge}
                          style={{ backgroundColor: statusConfig[entry.status]?.color }}
                        >
                          {statusConfig[entry.status]?.label}
                        </span>
                      </div>
                      <p className={cn(commonStyles.taskDesc, themeStyles.taskDesc)}>
                        {entry.task_description}
                      </p>
                      {entry.tags.length > 0 && (
                        <div className={commonStyles.tags}>
                          {entry.tags.map(tag => (
                            <span
                              key={tag}
                              className={cn(commonStyles.tag, themeStyles.tag)}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={commonStyles.entryMeta}>
                      {entry.billable && (
                        <span className={cn(commonStyles.billable, themeStyles.billable)}>
                          💵 ${(entry.duration_minutes / 60 * entry.hourly_rate).toFixed(2)}
                        </span>
                      )}
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className={cn(commonStyles.deleteBtn, themeStyles.deleteBtn)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {/* New Timer Modal */}
        {showTimer && (
          <div className={commonStyles.modalOverlay} onClick={() => setShowTimer(false)}>
            <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={(e) => e.stopPropagation()}>
              <div className={cn(commonStyles.modalHeader, themeStyles.modalHeader)}>
                <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>Start Timer</h2>
                <button
                  onClick={() => setShowTimer(false)}
                  className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                >
                  ×
                </button>
              </div>

              <div className={commonStyles.modalContent}>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Project *</label>
                  <select
                    value={newEntry.project_id}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, project_id: e.target.value }))}
                    className={cn(commonStyles.select, themeStyles.select)}
                  >
                    <option value="">Select a project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Task Description *</label>
                  <input
                    type="text"
                    value={newEntry.task_description}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, task_description: e.target.value }))}
                    placeholder="What are you working on?"
                    className={cn(commonStyles.input, themeStyles.input)}
                  />
                </div>

                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Tags</label>
                  <div className={commonStyles.tagInput}>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add a tag"
                      className={cn(commonStyles.input, themeStyles.input)}
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className={cn(commonStyles.addTagBtn, themeStyles.addTagBtn)}
                    >
                      Add
                    </button>
                  </div>
                  {newEntry.tags.length > 0 && (
                    <div className={commonStyles.selectedTags}>
                      {newEntry.tags.map(tag => (
                        <span key={tag} className={cn(commonStyles.selectedTag, themeStyles.selectedTag)}>
                          {tag}
                          <button onClick={() => removeTag(tag)}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className={commonStyles.formGroup}>
                  <label className={commonStyles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={newEntry.billable}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, billable: e.target.checked }))}
                    />
                    <span className={cn(commonStyles.checkboxText, themeStyles.checkboxText)}>
                      Billable time
                    </span>
                  </label>
                </div>

                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Notes (optional)</label>
                  <textarea
                    value={newEntry.notes}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes..."
                    rows={3}
                    className={cn(commonStyles.textarea, themeStyles.textarea)}
                  />
                </div>
              </div>

              <div className={cn(commonStyles.modalFooter, themeStyles.modalFooter)}>
                <button
                  onClick={() => setShowTimer(false)}
                  className={cn(commonStyles.cancelBtn, themeStyles.cancelBtn)}
                >
                  Cancel
                </button>
                <button
                  onClick={startTimer}
                  disabled={!newEntry.project_id || !newEntry.task_description.trim()}
                  className={cn(commonStyles.startTimerBtn, themeStyles.startTimerBtn)}
                >
                  ⏱️ Start Timer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
