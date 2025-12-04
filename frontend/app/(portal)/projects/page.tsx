// @AI-HINT: Universal portal route for Projects page - shows all projects
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { projectsApi } from '@/lib/api';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/app/components/Animations';
import Button from '@/app/components/Button/Button';
import { Briefcase, Search, Filter, ChevronRight } from 'lucide-react';

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

  const isDark = resolvedTheme === 'dark';

  return (
    <PageTransition>
      <div className={cn(
        'min-h-screen px-4 py-8 md:px-8',
        isDark ? 'bg-[#0a0a0c] text-white' : 'bg-gray-50 text-gray-900'
      )}>
        <ScrollReveal>
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Browse Projects</h1>
            <p className={cn('text-lg', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Find and explore available projects
            </p>
          </header>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className={cn(
            'flex gap-4 mb-8 p-4 rounded-xl',
            isDark ? 'bg-white/5' : 'bg-white shadow-sm'
          )}>
            <div className="flex-1 relative">
              <Search className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5',
                isDark ? 'text-gray-500' : 'text-gray-400'
              )} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full pl-10 pr-4 py-3 rounded-lg border transition-all',
                  isDark 
                    ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500' 
                    : 'bg-white border-gray-200 focus:border-blue-500'
                )}
              />
            </div>
            <Button variant="outline" size="md">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className={cn(
              'animate-spin rounded-full h-8 w-8 border-b-2',
              isDark ? 'border-blue-500' : 'border-blue-600'
            )} />
          </div>
        ) : projects.length > 0 ? (
          <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects
              .filter(p => !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((project, idx) => (
                <ScrollReveal key={project.id || idx}>
                  <div className={cn(
                    'p-6 rounded-xl border transition-all hover:shadow-lg cursor-pointer',
                    isDark 
                      ? 'bg-white/5 border-white/10 hover:border-white/20' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  )}>
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        isDark ? 'bg-blue-500/20' : 'bg-blue-50'
                      )}>
                        <Briefcase className={cn('w-5 h-5', isDark ? 'text-blue-400' : 'text-blue-600')} />
                      </div>
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                      )}>
                        {project.status || 'Open'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{project.title || 'Untitled Project'}</h3>
                    <p className={cn(
                      'text-sm mb-4 line-clamp-2',
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      {project.description || 'No description available.'}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className={cn('text-sm font-medium', isDark ? 'text-blue-400' : 'text-blue-600')}>
                        ${project.budget || '0'} budget
                      </span>
                      <ChevronRight className={cn('w-5 h-5', isDark ? 'text-gray-500' : 'text-gray-400')} />
                    </div>
                  </div>
                </ScrollReveal>
              ))}
          </StaggerContainer>
        ) : (
          <ScrollReveal>
            <div className={cn(
              'text-center py-16 rounded-xl',
              isDark ? 'bg-white/5' : 'bg-white'
            )}>
              <Briefcase className={cn(
                'w-12 h-12 mx-auto mb-4',
                isDark ? 'text-gray-600' : 'text-gray-300'
              )} />
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className={cn('text-sm', isDark ? 'text-gray-500' : 'text-gray-500')}>
                Check back later for new opportunities
              </p>
            </div>
          </ScrollReveal>
        )}
      </div>
    </PageTransition>
  );
}