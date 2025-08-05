// @AI-HINT: This component displays a list of recent projects. It's designed to provide a quick, scannable overview of project status, progress, and deadlines, a key feature in premium project management dashboards.

import React from 'react';
import { RecentProject } from '../../types';
import './DashboardRecentProjects.common.css';
import './DashboardRecentProjects.light.css';
import './DashboardRecentProjects.dark.css';

interface DashboardRecentProjectsProps {
  projects: RecentProject[];
}

const getStatusClass = (status: RecentProject['status']) => {
  switch (status) {
    case 'In Progress':
      return 'status--in-progress';
    case 'Review':
      return 'status--review';
    case 'Completed':
      return 'status--completed';
    case 'Overdue':
      return 'status--overdue';
    default:
      return '';
  }
};

const DashboardRecentProjects: React.FC<DashboardRecentProjectsProps> = ({ projects }) => {
  return (
    <div className="DashboardSection">
      <div className="DashboardSection-header">
        <h2>Recent Projects</h2>
        <a href="/projects" className="DashboardSection-view-all">View All</a>
      </div>
      <div className="DashboardRecentProjects-list">
        {projects.map((project) => (
          <div key={project.id} className={`ProjectCard ${getStatusClass(project.status)}`} style={{ '--progress-width': `${project.progress}%` } as React.CSSProperties}>
            <div className="ProjectCard-header">
              <h3 className="ProjectCard-title">{project.title}</h3>
              <span className={`ProjectCard-status ${getStatusClass(project.status)}`}>{project.status}</span>
            </div>
            <div className="ProjectCard-client">{project.client}</div>
            <div className="ProjectCard-progress">
              <div className="ProjectCard-progress-bar">
                <div className="ProjectCard-progress-fill"></div>
              </div>
              <span className="ProjectCard-progress-label">{project.progress}%</span>
            </div>
            <div className="ProjectCard-footer">
              <span className="ProjectCard-deadline">Deadline: {project.deadline}</span>
              <span className="ProjectCard-budget">{project.budget}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardRecentProjects;
