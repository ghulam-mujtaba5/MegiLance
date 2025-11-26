// @AI-HINT: This component is responsible for fetching and rendering the list of project cards. It handles its own data fetching, loading, and error states.
'use client';

import React, { useState, useEffect } from 'react';
import { ProjectType } from '../../types';
import ProjectCard from '../../../components/ProjectCard/ProjectCard';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { useToaster } from '@/app/components/Toast/ToasterProvider';
import api from '@/lib/api';
import commonStyles from './ProjectsList.common.module.css';
import lightStyles from './ProjectsList.light.module.css';
import darkStyles from './ProjectsList.dark.module.css';

const ProjectsList: React.FC = () => {
  const { notify } = useToaster();
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.projects.list();
        const mapped: ProjectType[] = (data.items || data || []).map((p: any) => ({
          id: p.id,
          name: p.title || p.name,
          status: p.status || 'pending',
          progress: p.progress ?? 0,
          budget: p.budget ?? 0,
          paid: p.paid ?? 0,
          freelancers: p.freelancers ?? [],
          updatedAt: p.updated_at || p.updatedAt || 'Recently updated',
          client: p.client_name || p.client || '',
        }));
        setProjects(mapped);
      } catch (err: any) {
        const message = err?.message || 'Unexpected error';
        setError(message);
        notify({ title: 'Error loading projects', description: message, variant: 'danger', duration: 3500 });
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [notify]);

  if (loading) return <div className="ProjectsList-loading">Loading projects...</div>;

  if (error) return <div className="ProjectsList-error" role="alert">Error: {error}</div>;

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects found"
        description="Create a new project to start tracking milestones and budgets."
        action={
          <button
            type="button"
            onClick={() => notify({ title: 'New project', description: 'Project creation flow coming soon.', variant: 'info', duration: 3000 })}
          >
            New Project
          </button>
        }
      />
    );
  }

  return (
    <div className="ProjectsList">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          id={project.id}
          title={project.name}
          status={((): 'In Progress' | 'Completed' | 'Pending' | 'Cancelled' => {
            switch (project.status) {
              case 'active':
                return 'In Progress';
              case 'completed':
                return 'Completed';
              case 'cancelled':
                return 'Cancelled';
              case 'pending':
              case 'on_hold':
              default:
                return 'Pending';
            }
          })()}
          progress={project.progress ?? 0}
          budget={typeof project.budget === 'number' ? project.budget : 0}
          paid={project.paid ?? 0}
          freelancers={project.freelancers ?? []}
          updatedAt={project.updatedAt ?? 'Recently updated'}
          clientName={project.client}
          postedTime={'Recently updated'}
          tags={[]}
        />
      ))}
    </div>
  );
};

export default ProjectsList;
