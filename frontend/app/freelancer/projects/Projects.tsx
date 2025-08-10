// @AI-HINT: This is the refactored Freelancer Projects page, featuring a premium layout, advanced search/filter bar, and a grid of available projects.
'use client';

import React, { useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import ProjectCard from '@/app/components/ProjectCard/ProjectCard';
import Input from '@/app/components/Input/Input';
import Button from '@/app/components/Button/Button';
import { useFreelancerData } from '@/hooks/useFreelancer';
import commonStyles from './Projects.common.module.css';
import lightStyles from './Projects.light.module.css';
import darkStyles from './Projects.dark.module.css';

const Projects: React.FC = () => {
  const { theme } = useTheme();
  const { jobs, loading, error } = useFreelancerData();
  const [searchQuery, setSearchQuery] = useState('');

  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  const filteredProjects = useMemo(() => {
    if (!Array.isArray(jobs)) return [];
    const query = searchQuery.trim().toLowerCase();
    return jobs
      .filter(job => 
        !query || 
        job.title?.toLowerCase().includes(query) ||
        job.clientName?.toLowerCase().includes(query) ||
        job.skills?.some(skill => skill.toLowerCase().includes(query))
      )
      .map((job, idx) => ({
        id: String(job.id ?? idx),
        title: job.title ?? 'Untitled Project',
        clientName: job.clientName ?? 'Unknown Client',
        budget: job.budget ?? '$0',
        postedTime: job.postedTime ?? 'Unknown',
        tags: Array.isArray(job.skills) ? job.skills : [],
      }));
  }, [jobs, searchQuery]);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Find Your Next Project</h1>
        <p className={styles.subtitle}>
          Browse thousands of jobs and find the perfect match for your skills.
        </p>
      </header>

      {loading && <div className={styles.loading} aria-busy={true}>Loading projects...</div>}
      {error && <div className={styles.error}>Failed to load projects.</div>}

      <div className={styles.searchFilterBar}>
        <div className={styles.searchInput}>
            <Input 
              type="text" 
              placeholder="Search by keyword, skill, or company..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        <Button variant="primary">Search</Button>
        {/* Future: Add advanced filter button here */}
      </div>

      <div className={styles.projectGrid}>
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} {...project} />
        ))}
        {filteredProjects.length === 0 && !loading && (
          <div className={styles.emptyState}>
            {searchQuery ? 'No projects match your search.' : 'No projects available.'}
          </div>
        )}
      </div>

      {/* Future: Add pagination controls here */}
    </div>
  );
};

export default Projects;
