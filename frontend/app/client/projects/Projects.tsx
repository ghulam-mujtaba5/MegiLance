'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import commonStyles from './Projects.common.module.css';
import lightStyles from './Projects.light.module.css';
import darkStyles from './Projects.dark.module.css';
import { Button } from '@/components/ui/button';

// @AI-HINT: This is the 'My Projects' page for clients. It has been fully refactored to use
// theme-aware CSS modules with camelCase conventions and modern import paths.

const mockProjects = [
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

const getStatusClass = (status: string, styles: any) => {
  switch (status) {
    case 'In Progress':
      return styles.statusInProgress;
    case 'Reviewing Proposals':
      return styles.statusReviewingProposals;
    case 'Completed':
      return styles.statusCompleted;
    case 'Open for Proposals':
        return styles.statusOpenForProposals;
    default:
      return '';
  }
};

const Projects: React.FC = () => {
  const { theme } = useTheme();
  const styles = {
    ...commonStyles,
    ...(theme === 'dark' ? darkStyles : lightStyles),
  };

  return (
    <div className={`${styles.projects} ${theme === 'dark' ? styles.projectsDark : styles.projectsLight}`}>
      <div className={styles.projectsContainer}>
        <header className={styles.projectsHeader}>
          <h1>My Projects</h1>
          <p>View and manage all your job postings from one place.</p>
        </header>

        <div className={styles.projectsGrid}>
          {mockProjects.map((project) => (
            <div key={project.id} className={styles.clientProjectCard}>
              <h3 className={styles.clientProjectCardTitle}>{project.title}</h3>
              <div className={`${styles.clientProjectCardStatus} ${getStatusClass(project.status, styles)}`}>
                {project.status}
              </div>
              <div className={styles.clientProjectCardInfo}>
                <p>{project.proposals} Proposals</p>
                {project.hiredFreelancer && <p>Hired: {project.hiredFreelancer}</p>}
              </div>
              <div className={styles.clientProjectCardActions}>
                  <Button variant="outline">View Details</Button>
                  {project.status.includes('Proposals') && (
                    <Button>Review Proposals</Button>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Projects;
