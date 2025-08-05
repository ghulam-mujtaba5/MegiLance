// @AI-HINT: This is the 'My Projects' page for clients to view all their job postings. All styles are per-component only.
'use client';

import React from 'react';

import Button from '@/app/components/Button/Button';
import commonStyles from './Projects.common.module.css';
import lightStyles from './Projects.light.module.css';
import darkStyles from './Projects.dark.module.css';
import { useTheme } from '@/app/contexts/ThemeContext';

// @AI-HINT: This is the 'My Projects' page for clients to view all their job postings. All styles are per-component only. Now fully theme-switchable using global theme context.

const Projects: React.FC = () => {
  // Mock data for client's projects
  const projects = [
    {
      id: '1',
      title: 'AI Chatbot Integration',
      status: 'In Progress',
      proposals: 12,
      hiredFreelancer: 'John D.',
    },
    {
      id: '2',
      title: 'Data Analytics Dashboard',
      status: 'Reviewing Proposals',
      proposals: 25,
      hiredFreelancer: null,
    },
    {
      id: '3',
      title: 'E-commerce Platform UI/UX',
      status: 'Completed',
      proposals: 8,
      hiredFreelancer: 'Mike R.',
    },
    {
      id: '4',
      title: 'Mobile App Backend (Node.js)',
      status: 'Open for Proposals',
      proposals: 5,
      hiredFreelancer: null,
    },
  ];

  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={`${commonStyles.projects} ${themeStyles.projects}`}>
      <div className={commonStyles.container}>
        <header className={commonStyles.header}>
          <h1>My Projects</h1>
          <p>View and manage all your job postings from one place.</p>
        </header>

        <div className={commonStyles.grid}>
          {projects.map((project) => (
            <div key={project.id} className={`${commonStyles.clientProjectCard} ${themeStyles.clientProjectCard}`}>
              <h3 className={commonStyles.clientProjectCardTitle}>{project.title}</h3>
              <div className={`${commonStyles.clientProjectCardStatus} ${commonStyles[`status--${project.status.replace(/\s+/g, '-')}`]}`}>{project.status}</div>
              <div className={commonStyles.clientProjectCardMeta}>
                <span>{project.proposals} Proposals</span>
                {project.hiredFreelancer && <span>Hired: {project.hiredFreelancer}</span>}
              </div>
              <Button variant="secondary" size="small">View Details</Button>
              {project.status.includes('Proposals') && (
                <Button variant="secondary" size="small">Review Proposals</Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Projects;
