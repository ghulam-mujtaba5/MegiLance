// @AI-HINT: Freelancer Projects page - shows projects the freelancer is working on
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import Loading from '@/app/components/Loading/Loading';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { contractsApi, proposalsApi } from '@/lib/api';
import { 
  Briefcase, 
  Clock, 
  DollarSign, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';

import commonStyles from './Projects.common.module.css';
import lightStyles from './Projects.light.module.css';
import darkStyles from './Projects.dark.module.css';

interface Project {
  id: string;
  title: string;
  client_name: string;
  status: string;
  budget: number;
  progress: number;
  deadline: string;
  created_at: string;
}

export default function FreelancerProjectsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await contractsApi.list({ status: statusFilter === 'all' ? undefined : statusFilter });
        const contractsList = Array.isArray(response) ? response : (response as any).contracts || [];
        
        const mappedProjects = contractsList.map((contract: any) => ({
          id: contract.id?.toString() || '',
          title: contract.title || contract.project_title || 'Untitled Project',
          client_name: contract.client_name || 'Client',
          status: contract.status || 'active',
          budget: contract.rate || contract.budget || 0,
          progress: contract.progress || 0,
          deadline: contract.end_date || contract.deadline || '',
          created_at: contract.created_at || new Date().toISOString(),
        }));
        
        setProjects(mappedProjects);
      } catch (err: any) {
        console.error('Failed to fetch projects:', err);
        setError(err.message || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      fetchProjects();
    }
  }, [mounted, statusFilter]);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const filteredProjects = useMemo(() => {
    return projects.filter(project => 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      active: { color: 'success', icon: <CheckCircle size={14} /> },
      completed: { color: 'primary', icon: <CheckCircle size={14} /> },
      pending: { color: 'warning', icon: <Clock size={14} /> },
      cancelled: { color: 'danger', icon: <AlertCircle size={14} /> },
    };
    const config = statusConfig[status.toLowerCase()] || statusConfig.pending;
    return (
      <span className={cn(commonStyles.statusBadge, commonStyles[`status${config.color}`])}>
        {config.icon}
        {status}
      </span>
    );
  };

  if (!mounted) {
    return <Loading />;
  }

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>My Projects</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Manage your ongoing and completed projects
          </p>
        </div>
        <Link href="/freelancer/jobs">
          <Button variant="primary" iconBefore={<Briefcase size={18} />}>
            Find New Projects
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className={cn(commonStyles.filters, themeStyles.filters)}>
        <div className={commonStyles.searchWrapper}>
          <Search size={18} className={commonStyles.searchIcon} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(commonStyles.searchInput, themeStyles.searchInput)}
          />
        </div>
        <div className={commonStyles.filterGroup}>
          <Filter size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn(commonStyles.filterSelect, themeStyles.filterSelect)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <Loading />
      ) : error ? (
        <EmptyState
          title="Error loading projects"
          description={error}
          action={<Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>}
        />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="You don't have any active projects yet. Start by finding new job opportunities."
          action={
            <Link href="/freelancer/jobs">
              <Button variant="primary">Browse Jobs</Button>
            </Link>
          }
        />
      ) : (
        <div className={commonStyles.projectsGrid}>
          {filteredProjects.map((project) => (
            <div key={project.id} className={cn(commonStyles.projectCard, themeStyles.projectCard)}>
              <div className={commonStyles.projectHeader}>
                <h3 className={cn(commonStyles.projectTitle, themeStyles.projectTitle)}>
                  {project.title}
                </h3>
                {getStatusBadge(project.status)}
              </div>
              
              <p className={cn(commonStyles.clientName, themeStyles.clientName)}>
                Client: {project.client_name}
              </p>
              
              <div className={commonStyles.projectMeta}>
                <div className={commonStyles.metaItem}>
                  <DollarSign size={16} />
                  <span>${project.budget.toLocaleString()}</span>
                </div>
                {project.deadline && (
                  <div className={commonStyles.metaItem}>
                    <Calendar size={16} />
                    <span>{new Date(project.deadline).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              
              {project.progress > 0 && (
                <div className={commonStyles.progressWrapper}>
                  <div className={commonStyles.progressBar}>
                    <div 
                      className={cn(commonStyles.progressFill, themeStyles.progressFill)}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className={commonStyles.progressText}>{project.progress}%</span>
                </div>
              )}
              
              <div className={commonStyles.projectActions}>
                <Link href={`/freelancer/contracts/${project.id}`}>
                  <Button variant="outline" size="sm">View Details</Button>
                </Link>
                <Link href={`/freelancer/messages?project=${project.id}`}>
                  <Button variant="ghost" size="sm">Message Client</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
