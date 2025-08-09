// @AI-HINT: This component is responsible for fetching and rendering the list of project cards. It handles its own data fetching, loading, and error states.
'use client';

import React, { useState, useEffect } from 'react';
import { ProjectType } from '../../types';
import ProjectCard from '../../../components/ProjectCard/ProjectCard';
import commonStyles from './ProjectsList.common.module.css';
import lightStyles from './ProjectsList.light.module.css';
import darkStyles from './ProjectsList.dark.module.css';

const ProjectsList: React.FC = () => {
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data: ProjectType[] = await response.json();
        setProjects(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return <div className="ProjectsList-loading">Loading projects...</div>;
  }

  if (error) {
    return <div className="ProjectsList-error">Error: {error}</div>;
  }

  return (
    <div className="ProjectsList">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          title={project.name}
          clientName={project.client}
          budget={`$${project.budget.toLocaleString()}`}
          postedTime={'Recently updated'}
          tags={[]}
        />
      ))}
    </div>
  );
};

export default ProjectsList;
