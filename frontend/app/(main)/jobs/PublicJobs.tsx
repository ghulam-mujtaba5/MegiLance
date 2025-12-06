// @AI-HINT: Public Jobs search page.
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { FaSearch, FaBriefcase, FaClock, FaDollarSign, FaTag } from 'react-icons/fa';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';

import commonStyles from './PublicJobs.common.module.css';
import lightStyles from './PublicJobs.light.module.css';
import darkStyles from './PublicJobs.dark.module.css';

interface Project {
  id: number;
  title: string;
  description: string;
  category: string;
  budget_type: string;
  budget_min: number;
  budget_max: number;
  experience_level: string;
  estimated_duration: string;
  skills: string[];
  client_id: number;
  status: string;
  created_at: string;
}

const PublicJobs: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    page: cn(commonStyles.page, themeStyles.page),
    header: cn(commonStyles.header, themeStyles.header),
    title: cn(commonStyles.title, themeStyles.title),
    subtitle: cn(commonStyles.subtitle, themeStyles.subtitle),
    controls: cn(commonStyles.controls, themeStyles.controls),
    searchInput: cn(commonStyles.searchInput, themeStyles.searchInput),
    grid: cn(commonStyles.grid, themeStyles.grid),
    card: cn(commonStyles.card, themeStyles.card),
    cardHeader: cn(commonStyles.cardHeader, themeStyles.cardHeader),
    jobTitle: cn(commonStyles.jobTitle, themeStyles.jobTitle),
    clientInfo: cn(commonStyles.clientInfo, themeStyles.clientInfo),
    budget: cn(commonStyles.budget, themeStyles.budget),
    description: cn(commonStyles.description, themeStyles.description),
    tags: cn(commonStyles.tags, themeStyles.tags),
    tag: cn(commonStyles.tag, themeStyles.tag),
    footer: cn(commonStyles.footer, themeStyles.footer),
    loading: cn(commonStyles.loading, themeStyles.loading),
    error: cn(commonStyles.error, themeStyles.error),
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchProjects();
  }, [debouncedSearch]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      // Using api.projects.list but need to handle the search query manually since list takes specific filters
      // Or use api.search.projects if it's a search
      // The original code used /backend/api/projects?limit=50&search=...
      // api.projects.list takes { status, category, page, page_size }
      // It seems api.projects.list doesn't support 'search' param in the type definition but let's check if we can pass it via 'any' or update api.ts
      
      // Let's use api.search.projects if there is a query, otherwise api.projects.list
      
      let data;
      if (debouncedSearch) {
        data = await api.search.projects(debouncedSearch, { page_size: 50 });
      } else {
        // We need to cast to any to pass 'limit' if it's not in the type, or use page_size
        data = await api.projects.list({ page_size: 50 });
      }
      
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Failed to load jobs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = (project: Project) => {
    if (project.budget_type === 'fixed') {
      if (project.budget_max) {
        return `$${project.budget_max.toLocaleString()}`;
      }
      return 'Fixed Price';
    } else {
      return `$${project.budget_min} - $${project.budget_max}/hr`;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <PageTransition>
      <div className={styles.page}>
        <ScrollReveal>
          <div className={styles.header}>
            <h1 className={styles.title}>Find Work</h1>
            <p className={styles.subtitle}>Browse the latest jobs and start your next project.</p>
          </div>

          <div className={styles.controls}>
            <div className={styles.searchInput}>
              <Input
                placeholder="Search for jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                iconBefore={<FaSearch />}
                fullWidth
              />
            </div>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className={styles.loading}>Loading jobs...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <StaggerContainer className={styles.grid}>
            {projects.length === 0 ? (
              <StaggerItem>
                <div className="text-center py-12 opacity-75">
                  No jobs found matching your criteria.
                </div>
              </StaggerItem>
            ) : (
              projects.map((project) => (
                <StaggerItem key={project.id}>
                  <Link href={`/jobs/${project.id}`} className="block">
                    <div className={styles.card}>
                      <div className={styles.cardHeader}>
                        <div>
                          <h3 className={styles.jobTitle}>{project.title}</h3>
                          <div className={styles.clientInfo}>
                            {project.experience_level} • {project.estimated_duration}
                          </div>
                        </div>
                        <div className={styles.budget}>
                          {formatBudget(project)}
                        </div>
                      </div>

                      <p className={styles.description}>{project.description}</p>

                      <div className={styles.tags}>
                        {project.skills.slice(0, 5).map((skill, index) => (
                          <span key={index} className={styles.tag}>
                            {skill}
                          </span>
                        ))}
                        {project.skills.length > 5 && (
                          <span className={styles.tag}>+{project.skills.length - 5}</span>
                        )}
                      </div>

                      <div className={styles.footer}>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <FaClock className="text-xs" /> {formatTimeAgo(project.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaBriefcase className="text-xs" /> {project.budget_type === 'hourly' ? 'Hourly' : 'Fixed'}
                          </span>
                        </div>
                        <Button variant="outline" size="sm">View Details</Button>
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              ))
            )}
          </StaggerContainer>
        )}
      </div>
    </PageTransition>
  );
};

export default PublicJobs;
