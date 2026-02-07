// @AI-HINT: Universal portal route for Projects page - shows all projects
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { projectsApi } from '@/lib/api';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import { StaggerContainer } from '@/app/components/Animations/StaggerContainer';
import Button from '@/app/components/Button/Button';
import { Briefcase, Search, Filter, ChevronRight } from 'lucide-react';
import commonStyles from './Projects.common.module.css';
import lightStyles from './Projects.light.module.css';
import darkStyles from './Projects.dark.module.css';

export default function PortalProjectsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await projectsApi.list({ page: 1, page_size: 20 });
      setProjects(Array.isArray(data) ? data : (data as any)?.items || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const themed = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.page, themed.page)}>
        <ScrollReveal>
          <header className={commonStyles.header}>
            <h1 className={commonStyles.title}>Browse Projects</h1>
            <p className={cn(commonStyles.subtitle, themed.subtitle)}>
              Find and explore available projects
            </p>
          </header>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className={cn(commonStyles.toolbar, themed.toolbar)}>
            <div className={commonStyles.searchWrapper}>
              <Search className={cn(commonStyles.searchIcon, themed.searchIcon)} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(commonStyles.searchInput, themed.searchInput)}
              />
            </div>
            <Button variant="outline" size="md">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className={commonStyles.loadingWrapper}>
            <div className={cn(commonStyles.spinner, themed.spinner)} />
          </div>
        ) : projects.length > 0 ? (
          <StaggerContainer className={commonStyles.grid}>
            {projects
              .filter(p => !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((project, idx) => (
                <ScrollReveal key={project.id || idx}>
                  <div className={cn(commonStyles.projectCard, themed.projectCard)}>
                    <div className={commonStyles.cardTop}>
                      <div className={cn(commonStyles.iconWrapper, themed.iconWrapper)}>
                        <Briefcase className={cn(commonStyles.projectIcon, themed.projectIcon)} />
                      </div>
                      <span className={cn(commonStyles.statusBadge, themed.statusBadge)}>
                        {project.status || 'Open'}
                      </span>
                    </div>
                    <h3 className={commonStyles.cardTitle}>{project.title || 'Untitled Project'}</h3>
                    <p className={cn(commonStyles.cardDescription, themed.cardDescription)}>
                      {project.description || 'No description available.'}
                    </p>
                    <div className={commonStyles.cardFooter}>
                      <span className={cn(commonStyles.budget, themed.budget)}>
                        ${project.budget || '0'} budget
                      </span>
                      <ChevronRight className={cn(commonStyles.chevron, themed.chevron)} />
                    </div>
                  </div>
                </ScrollReveal>
              ))}
          </StaggerContainer>
        ) : (
          <ScrollReveal>
            <div className={cn(commonStyles.emptyState, themed.emptyState)}>
              <Briefcase className={cn(commonStyles.emptyIcon, themed.emptyIcon)} />
              <h3 className={commonStyles.emptyTitle}>No projects found</h3>
              <p className={cn(commonStyles.emptyText, themed.emptyText)}>
                Check back later for new opportunities
              </p>
            </div>
          </ScrollReveal>
        )}
      </div>
    </PageTransition>
  );
}