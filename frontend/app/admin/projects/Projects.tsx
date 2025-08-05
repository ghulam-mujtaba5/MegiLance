// @AI-HINT: This is the Project Management page for admins to view, search, and manage platform projects. All styles are per-component only.
'use client';

import React, { useState, useEffect } from 'react';
import Input from '@/app/components/Input/Input';
import Button from '@/app/components/Button/Button';
import './Projects.common.css';
import './Projects.light.css';
import './Projects.dark.css';

interface ProjectsProps {
  theme?: 'light' | 'dark';
}

interface Project {
  id: string;
  title: string;
  client: string;
  freelancer: string;
  status: string;
  budget: number;
  flagged: boolean;
}

const Projects: React.FC<ProjectsProps> = ({ theme = 'light' }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data: Project[] = await response.json();
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
    return <div className={`Projects-status Projects-status--${theme}`}>Loading projects...</div>;
  }

  if (error) {
    return <div className={`Projects-status Projects-status--error Projects-status--${theme}`}>Error: {error}</div>;
  }

  return (
    <div className={`Projects Projects--${theme}`}>
      <header className="Projects-header">
        <h1>Project Management</h1>
        <div className="Projects-actions">
          <Input theme={theme} type="search" placeholder="Search by title or user..." />
        </div>
      </header>

      <div className={`Projects-table-container Projects-table-container--${theme}`}>
        <table className="Projects-table">
          <thead>
            <tr>
              <th>Project Title</th>
              <th>Client</th>
              <th>Freelancer</th>
              <th>Budget</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project.id} className={project.flagged ? 'flagged' : ''}>
                <td>{project.title}</td>
                <td>{project.client}</td>
                <td>{project.freelancer}</td>
                <td>${project.budget.toLocaleString()}</td>
                <td>
                  <span className={`status-badge status-badge--${project.status.replace(/\s+/g, '-').toLowerCase()}`}>{project.status}</span>
                </td>
                <td>
                  <div className="Table-actions">
                    <Button theme={theme} variant="outline" size="small">Details</Button>
                    <Button theme={theme} variant="danger-outline" size="small">Remove</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Projects;
