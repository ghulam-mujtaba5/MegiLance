// @AI-HINT: Freelancer saved jobs page - bookmarked project listings for later application
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import commonStyles from './SavedJobs.common.module.css';
import lightStyles from './SavedJobs.light.module.css';
import darkStyles from './SavedJobs.dark.module.css';

interface SavedJob {
  id: string;
  title: string;
  description: string;
  budget_type: 'fixed' | 'hourly';
  budget_min: number;
  budget_max: number;
  skills: string[];
  client_name: string;
  posted_at: string;
  proposals_count: number;
  saved_at: string;
}

export default function SavedJobsPage() {
  const { resolvedTheme } = useTheme();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    loadSavedJobs();
  }, []);

  const loadSavedJobs = async () => {
    try {
      setLoading(true);
      // Use demo data - API endpoint for saved jobs not yet implemented
      
      // Demo data
      setSavedJobs([
        {
          id: '1',
          title: 'Full-Stack E-commerce Platform Development',
          description: 'Looking for an experienced developer to build a modern e-commerce platform with React and Node.js. Must include payment integration, inventory management, and admin dashboard.',
          budget_type: 'fixed',
          budget_min: 5000,
          budget_max: 8000,
          skills: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
          client_name: 'TechCorp Inc.',
          posted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          proposals_count: 12,
          saved_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          title: 'Mobile App UI/UX Redesign',
          description: 'Need a talented designer to modernize our mobile banking app. Looking for clean, intuitive designs that improve user experience.',
          budget_type: 'hourly',
          budget_min: 50,
          budget_max: 80,
          skills: ['Figma', 'UI Design', 'Mobile Design', 'Prototyping'],
          client_name: 'FinanceApp Ltd',
          posted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          proposals_count: 24,
          saved_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          title: 'AI Chatbot Integration',
          description: 'Integrate an AI-powered chatbot into our customer support system. Must use OpenAI API and handle complex customer queries.',
          budget_type: 'fixed',
          budget_min: 2000,
          budget_max: 3500,
          skills: ['Python', 'OpenAI', 'FastAPI', 'NLP'],
          client_name: 'SupportDesk Co',
          posted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          proposals_count: 8,
          saved_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Failed to load saved jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (jobId: string) => {
    setRemovingId(jobId);
    try {
      // API not yet available, just remove from UI
      setSavedJobs(prev => prev.filter(job => job.id !== jobId));
    } finally {
      setRemovingId(null);
    }
  };

  const formatBudget = (job: SavedJob) => {
    if (job.budget_type === 'hourly') {
      return `$${job.budget_min} - $${job.budget_max}/hr`;
    }
    return `$${job.budget_min.toLocaleString()} - $${job.budget_max.toLocaleString()}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <h1 className={cn(commonStyles.title, themeStyles.title)}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          Saved Jobs
        </h1>
        <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
          {savedJobs.length} job{savedJobs.length !== 1 ? 's' : ''} saved for later
        </p>
      </div>

      {loading ? (
        <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
          <p>Loading saved jobs...</p>
        </div>
      ) : savedJobs.length === 0 ? (
        <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          <h3>No Saved Jobs</h3>
          <p>Browse projects and save interesting ones for later</p>
          <Button variant="primary" onClick={() => window.location.href = '/freelancer/find-work'}>
            Browse Jobs
          </Button>
        </div>
      ) : (
        <div className={commonStyles.jobsList}>
          {savedJobs.map(job => (
            <div key={job.id} className={cn(commonStyles.jobCard, themeStyles.jobCard)}>
              <div className={commonStyles.jobHeader}>
                <div className={commonStyles.jobTitleRow}>
                  <h3 className={cn(commonStyles.jobTitle, themeStyles.jobTitle)}>{job.title}</h3>
                  <span className={cn(commonStyles.savedTime, themeStyles.savedTime)}>
                    Saved {formatTimeAgo(job.saved_at)}
                  </span>
                </div>
                <p className={cn(commonStyles.clientName, themeStyles.clientName)}>
                  {job.client_name} • Posted {formatTimeAgo(job.posted_at)}
                </p>
              </div>

              <p className={cn(commonStyles.description, themeStyles.description)}>
                {job.description}
              </p>

              <div className={commonStyles.skills}>
                {job.skills.map(skill => (
                  <span key={skill} className={cn(commonStyles.skill, themeStyles.skill)}>
                    {skill}
                  </span>
                ))}
              </div>

              <div className={commonStyles.jobFooter}>
                <div className={commonStyles.jobMeta}>
                  <span className={cn(commonStyles.budget, themeStyles.budget)}>
                    {formatBudget(job)}
                    <span className={cn(commonStyles.budgetType, themeStyles.budgetType)}>
                      {job.budget_type === 'hourly' ? 'Hourly' : 'Fixed Price'}
                    </span>
                  </span>
                  <span className={cn(commonStyles.proposals, themeStyles.proposals)}>
                    {job.proposals_count} proposal{job.proposals_count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className={commonStyles.actions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(job.id)}
                    isLoading={removingId === job.id}
                  >
                    Remove
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => window.location.href = `/freelancer/projects/${job.id}`}
                  >
                    View & Apply
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
