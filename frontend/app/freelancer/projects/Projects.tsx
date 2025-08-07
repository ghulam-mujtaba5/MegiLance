// @AI-HINT: This is the refactored Freelancer Projects page, featuring a premium layout, advanced search/filter bar, and a grid of available projects.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import ProjectCard from '@/app/components/ProjectCard/ProjectCard';
import Input from '@/app/components/Input/Input';
import Button from '@/app/components/Button/Button';
import commonStyles from './Projects.common.module.css';
import lightStyles from './Projects.light.module.css';
import darkStyles from './Projects.dark.module.css';

const projects = [
  {
    title: 'AI-Powered Content Generation Platform',
    clientName: 'ContentAI Solutions',
    budget: '$15,000 - $25,000',
    postedTime: '4 hours ago',
    tags: ['Next.js', 'TypeScript', 'AI', 'Prisma'],
  },
  {
    title: 'Real-Time IoT Data Visualization Dashboard',
    clientName: 'Connected Devices Inc.',
    budget: '$20,000',
    postedTime: '12 hours ago',
    tags: ['React', 'D3.js', 'WebSocket', 'IoT'],
  },
  {
    title: 'Mobile App for Financial Literacy',
    clientName: 'FinEd Mobile',
    budget: '$10,000',
    postedTime: '1 day ago',
    tags: ['React Native', 'Firebase', 'UX/UI'],
  },
  {
    title: 'Corporate Website Redesign',
    clientName: 'Global Synergy Corp',
    budget: '$8,500',
    postedTime: '2 days ago',
    tags: ['Figma', 'Webflow', 'CMS'],
  },
  {
    title: 'Cloud Migration & Infrastructure Setup',
    clientName: 'ScaleFast Startups',
    budget: '$30,000+',
    postedTime: '4 days ago',
    tags: ['AWS', 'Terraform', 'Kubernetes', 'DevOps'],
  },
  {
    title: 'E-commerce Backend with Headless CMS',
    clientName: 'Modern Retail Co.',
    budget: '$18,000',
    postedTime: '5 days ago',
    tags: ['Node.js', 'GraphQL', 'Strapi', 'PostgreSQL'],
  },
];

const Projects: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Find Your Next Project</h1>
        <p className={styles.subtitle}>
          Browse thousands of jobs and find the perfect match for your skills.
        </p>
      </header>

      <div className={styles.searchFilterBar}>
        <div className={styles.searchInput}>
            <Input type="text" placeholder="Search by keyword, skill, or company..." />
        </div>
        <Button variant="primary">Search</Button>
        {/* Future: Add advanced filter button here */}
      </div>

      <div className={styles.projectGrid}>
        {projects.map((project, idx) => (
          <ProjectCard key={idx} {...project} />
        ))}
      </div>

      {/* Future: Add pagination controls here */}
    </div>
  );
};

export default Projects;
