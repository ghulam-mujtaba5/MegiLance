// @AI-HINT: Universal portal route for Projects page - shows all projects
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { projectsApi } from '@/lib/api';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import Button from '@/app/components/Button/Button';
import { Badge } from '@/app/components/Badge';
import Loading from '@/app/components/Loading/Loading';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { ProjectsIllustration } from '@/app/components/Illustrations/Illustrations';
import illustrationStyles from '@/app/components/Illustrations/Illustrations.module.css';
import { Briefcase, Search, Filter, ChevronRight, Calendar, DollarSign, Users, Clock } from 'lucide-react';
import commonStyles from './Projects.common.module.css';
import lightStyles from './Projects.light.module.css';
import darkStyles from './Projects.dark.module.css';

const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'primary' | 'secondary' => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'primary' | 'secondary'> = {
    open: 'success', active: 'primary', in_progress: 'warning', completed: 'secondary', closed: 'danger'
  };
  return map[status?.toLowerCase()] || 'primary';
};

export default function PortalProjectsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (statusFilter !== 'all' && (p.status || 'open').toLowerCase() !== statusFilter) return false;
      if (searchQuery && !p.title?.toLowerCase().includes(searchQuery.toLowerCase()) && !p.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [projects, searchQuery, statusFilter]);

  const statusCounts = useMemo(() => ({
    open: projects.filter(p => (p.status || 'open').toLowerCase() === 'open').length,
    active: projects.filter(p => ['active', 'in_progress'].includes((p.status || '').toLowerCase())).length,
  }), [projects]);

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
            <div className={commonStyles.filterTabs}>
              {[
                { key: 'all', label: 'All' },
                { key: 'open', label: 'Open', count: statusCounts.open },
                { key: 'active', label: 'Active', count: statusCounts.active },
              ].map(f => (
                <button
                  key={f.key}
                  className={cn(commonStyles.filterTab, themed.filterTab, statusFilter === f.key && commonStyles.filterTabActive, statusFilter === f.key && themed.filterTabActive)}
                  onClick={() => setStatusFilter(f.key)}
                >
                  {f.label}
                  {f.count !== undefined && f.count > 0 && (
                    <span className={commonStyles.filterCount}>{f.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {loading ? <Loading /> : filteredProjects.length > 0 ? (
          <StaggerContainer className={commonStyles.grid}>
            {filteredProjects.map((project, idx) => (
              <StaggerItem key={project.id || idx}>
                <div className={cn(commonStyles.projectCard, themed.projectCard)}>
                  <div className={commonStyles.cardTop}>
                    <div className={cn(commonStyles.iconWrapper, themed.iconWrapper)}>
                      <Briefcase className={cn(commonStyles.projectIcon, themed.projectIcon)} />
                    </div>
                    <Badge variant={getStatusVariant(project.status || 'open')}>
                      {(project.status || 'Open').replace('_', ' ')}
                    </Badge>
                  </div>
                  <h3 className={commonStyles.cardTitle}>{project.title || 'Untitled Project'}</h3>
                  <p className={cn(commonStyles.cardDescription, themed.cardDescription)}>
                    {project.description || 'No description available.'}
                  </p>
                  
                  {/* Skills Tags */}
                  {project.required_skills && project.required_skills.length > 0 && (
                    <div className={commonStyles.skillTags}>
                      {project.required_skills.slice(0, 3).map((skill: string, i: number) => (
                        <span key={i} className={cn(commonStyles.skillTag, themed.skillTag)}>{skill}</span>
                      ))}
                      {project.required_skills.length > 3 && (
                        <span className={cn(commonStyles.skillTag, themed.skillTag)}>+{project.required_skills.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className={commonStyles.cardFooter}>
                    <div className={commonStyles.cardMeta}>
                      <span className={cn(commonStyles.metaItem, themed.metaItem)}>
                        <DollarSign size={14} />
                        ${project.budget?.toLocaleString() || '0'}
                      </span>
                      {project.deadline && (
                        <span className={cn(commonStyles.metaItem, themed.metaItem)}>
                          <Calendar size={14} />
                          {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {project.proposals_count !== undefined && (
                        <span className={cn(commonStyles.metaItem, themed.metaItem)}>
                          <Users size={14} />
                          {project.proposals_count} proposals
                        </span>
                      )}
                    </div>
                    <ChevronRight className={cn(commonStyles.chevron, themed.chevron)} />
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <EmptyState
            icon={<ProjectsIllustration className={illustrationStyles.emptyStateIllustration} />}
            title="No projects found"
            description={searchQuery ? 'Try adjusting your search or filter' : 'Check back later for new opportunities'}
          />
        )}
      </div>
    </PageTransition>
  );
}