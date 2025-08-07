// @AI-HINT: This is the refactored Project Details page, featuring a premium two-column layout, detailed project information, and a client sidebar.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import Button from '@/app/components/Button/Button';
import commonStyles from './ProjectDetails.common.module.css';
import lightStyles from './ProjectDetails.light.module.css';
import darkStyles from './ProjectDetails.dark.module.css';

interface ProjectDetailsProps {
  projectId: string;
}

// Mock data - in a real app, this would be fetched based on projectId
const project = {
  title: 'AI-Powered Content Generation Platform',
  clientName: 'ContentAI Solutions',
  clientAvatar: '', // Placeholder for client avatar URL
  budget: '$15,000 - $25,000',
  postedTime: '4 hours ago',
  tags: ['Next.js', 'TypeScript', 'AI', 'Prisma', 'Tailwind CSS'],
  description: `We are seeking a highly skilled senior frontend developer to lead the development of our next-generation content generation platform. This is a key role in a well-funded startup, and you will have significant ownership over the product's direction.\n\n**Responsibilities:**\n- Architect and build the main user-facing application using Next.js and TypeScript.\n- Collaborate with our AI team to integrate a complex language model API.\n- Design and implement a robust, scalable, and performant UI.\n- Write clean, maintainable, and well-tested code.\n\n**Qualifications:**\n- 5+ years of experience with React and the JavaScript ecosystem.\n- Proven experience with TypeScript in a large-scale application.\n- Deep understanding of Next.js, including SSR, SSG, and API routes.\n- Experience with data fetching libraries like SWR or React Query.`,
  proposals: 18,
  clientLocation: 'San Francisco, CA',
  clientRating: 4.9,
  clientJobsPosted: 24,
};

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ projectId }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  return (
    <div className={styles.pageContainer}>
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1 className={styles.title}>{project.title}</h1>
          <div className={styles.tagContainer}>
            {project.tags.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Project Description</h2>
          <p className={styles.description}>{project.description}</p>
        </section>
      </main>

      <aside className={styles.sidebar}>
        <div className={styles.sidebarCard}>
            <Button variant="primary" fullWidth>Submit a Proposal</Button>
            {/* Future: Add a 'Save Job' button here */}
        </div>

        <div className={styles.sidebarCard}>
          <h3 className={styles.sectionTitle}>About the Client</h3>
          <div className={styles.clientInfo}>
            <UserAvatar name={project.clientName} src={project.clientAvatar} />
            <span className={styles.clientName}>{project.clientName}</span>
          </div>
           <ul className={styles.detailsList}>
            <li className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Rating</span>
                <span className={styles.detailsValue}>{project.clientRating} / 5</span>
            </li>
            <li className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Location</span>
                <span className={styles.detailsValue}>{project.clientLocation}</span>
            </li>
            <li className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Jobs Posted</span>
                <span className={styles.detailsValue}>{project.clientJobsPosted}</span>
            </li>
           </ul>
        </div>

        <div className={styles.sidebarCard}>
          <h3 className={styles.sectionTitle}>Project Details</h3>
          <ul className={styles.detailsList}>
            <li className={styles.detailsItem}>
              <span className={styles.detailsLabel}>Budget</span>
              <span className={styles.detailsValue}>{project.budget}</span>
            </li>
            <li className={styles.detailsItem}>
              <span className={styles.detailsLabel}>Posted</span>
              <span className={styles.detailsValue}>{project.postedTime}</span>
            </li>
            <li className={styles.detailsItem}>
              <span className={styles.detailsLabel}>Proposals</span>
              <span className={styles.detailsValue}>{project.proposals}</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default ProjectDetails;
