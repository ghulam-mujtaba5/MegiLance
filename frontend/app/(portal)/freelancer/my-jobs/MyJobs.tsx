// @AI-HINT: This is the modernized 'My Jobs' page. It uses the reusable PaginatedJobGrid component to display active and completed jobs, resulting in a clean, maintainable, and premium implementation.
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import PaginatedJobGrid from './components/PaginatedJobGrid/PaginatedJobGrid';
import { JobStatusCardProps } from './components/JobStatusCard/JobStatusCard';
import { SortOption } from '@/app/components/DataToolbar/DataToolbar';
import Button from '@/app/components/Button/Button';

import commonStyles from './MyJobs.common.module.css';
import lightStyles from './MyJobs.light.module.css';
import darkStyles from './MyJobs.dark.module.css';

// API contract type
interface APIContract {
  id: string;
  project_id: number;
  freelancer_id: number;
  client_id: number;
  total_amount: number;
  status: string;
  start_date: string;
  end_date: string;
  description: string;
  milestones: string;
  terms: string;
  created_at: string;
  updated_at: string;
}

interface APIProject {
  id: number;
  title: string;
  client_id: number;
  client_name?: string;
}

const activeSortOptions: SortOption[] = [
  { value: 'progress:desc', label: 'Progress: High to Low' },
  { value: 'progress:asc', label: 'Progress: Low to High' },
  { value: 'title:asc', label: 'Title A–Z' },
  { value: 'title:desc', label: 'Title Z–A' },
  { value: 'client:asc', label: 'Client A–Z' },
  { value: 'client:desc', label: 'Client Z–A' },
];

const completedSortOptions: SortOption[] = [
  { value: 'completionDate:desc', label: 'Newest' },
  { value: 'completionDate:asc', label: 'Oldest' },
  { value: 'title:asc', label: 'Title A–Z' },
  { value: 'title:desc', label: 'Title Z–A' },
  { value: 'client:asc', label: 'Client A–Z' },
  { value: 'client:desc', label: 'Client Z–A' },
];

// Map contract status to display status and progress
const getStatusAndProgress = (status: string): { displayStatus: string; progress: number } => {
  const normalized = status.toLowerCase();
  switch (normalized) {
    case 'pending':
    case 'negotiation':
      return { displayStatus: 'Negotiation', progress: 10 };
    case 'active':
    case 'in_progress':
      return { displayStatus: 'Development', progress: 50 };
    case 'review':
    case 'client_review':
      return { displayStatus: 'Client Review', progress: 85 };
    case 'completed':
    case 'finished':
      return { displayStatus: 'Completed', progress: 100 };
    case 'cancelled':
    case 'terminated':
      return { displayStatus: 'Cancelled', progress: 0 };
    default:
      return { displayStatus: 'In Progress', progress: 50 };
  }
};

const MyJobs: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeJobs, setActiveJobs] = useState<JobStatusCardProps[]>([]);
  const [completedJobs, setCompletedJobs] = useState<JobStatusCardProps[]>([]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch contracts for current freelancer
      const contractsRes = await fetch('/backend/api/contracts/', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });
      
      if (!contractsRes.ok) {
        throw new Error('Failed to fetch contracts');
      }
      
      const contracts: APIContract[] = await contractsRes.json();
      
      // Get unique project IDs to fetch project details
      const projectIds = [...new Set(contracts.map(c => c.project_id))];
      
      // Fetch project details for job titles and client names
      const projectPromises = projectIds.map(async (pid) => {
        try {
          const res = await fetch(`/backend/api/projects/${pid}`, {
            credentials: 'include',
            headers: { 'Accept': 'application/json' },
          });
          if (res.ok) {
            return await res.json();
          }
        } catch {
          // Ignore individual project fetch errors
        }
        return null;
      });
      
      const projectsData = await Promise.all(projectPromises);
      const projectMap = new Map<number, APIProject>();
      projectsData.filter(Boolean).forEach((project: APIProject) => {
        if (project) projectMap.set(project.id, project);
      });
      
      // Transform contracts to job cards
      const active: JobStatusCardProps[] = [];
      const completed: JobStatusCardProps[] = [];
      
      contracts.forEach((contract) => {
        const project = projectMap.get(contract.project_id);
        const { displayStatus, progress } = getStatusAndProgress(contract.status);
        
        const jobCard: JobStatusCardProps = {
          title: project?.title || `Project #${contract.project_id}`,
          client: project?.client_name || 'Client',
          status: displayStatus,
          progress,
        };
        
        if (progress === 100 || contract.status.toLowerCase() === 'completed') {
          jobCard.completionDate = contract.end_date || contract.updated_at?.split('T')[0];
          completed.push(jobCard);
        } else if (contract.status.toLowerCase() !== 'cancelled' && contract.status.toLowerCase() !== 'terminated') {
          active.push(jobCard);
        }
      });
      
      setActiveJobs(active);
      setCompletedJobs(completed);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  if (!resolvedTheme) return null;

  return (
    <div className={cn(commonStyles.container, styles.container)}>
      <header className={cn(commonStyles.header, styles.header)}>
        <h1 className={cn(commonStyles.title, styles.title)}>My Jobs</h1>
        <p className={cn(commonStyles.subtitle, styles.subtitle)}>Track your active projects and review completed work.</p>
      </header>

      {error ? (
        <div className={cn(commonStyles.emptyState, styles.emptyState)}>
          <h3>Error Loading Jobs</h3>
          <p>{error}</p>
          <Button variant="primary" onClick={fetchJobs}>Try Again</Button>
        </div>
      ) : loading ? (
        <div className={cn(commonStyles.loadingState, styles.loadingState)}>
          <div className={cn(commonStyles.spinner, styles.spinner)} />
          <p>Loading your jobs...</p>
        </div>
      ) : (
        <div className={cn(commonStyles.gridsContainer, styles.gridsContainer)}>
          <PaginatedJobGrid
            storageKey="freelancer:my-jobs:active"
            jobs={activeJobs}
            sortOptions={activeSortOptions}
            defaultSortKey="progress"
            searchKeys={['title', 'client', 'status']}
            title="Active Jobs"
          />
          <PaginatedJobGrid
            storageKey="freelancer:my-jobs:completed"
            jobs={completedJobs}
            sortOptions={completedSortOptions}
            defaultSortKey="completionDate"
            searchKeys={['title', 'client', 'completionDate']}
            title="Completed Jobs"
          />
        </div>
      )}
    </div>
  );
};

export default MyJobs;
