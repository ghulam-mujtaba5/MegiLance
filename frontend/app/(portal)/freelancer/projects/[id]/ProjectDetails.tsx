// @AI-HINT: This is the refactored Project Details page, featuring a premium two-column layout, detailed project information, and a client sidebar.
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import Button from '@/app/components/Button/Button';
import { projectsApi, usersApi } from '@/lib/api';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import { Briefcase, MapPin, Star, Clock, Users, DollarSign, AlertCircle } from 'lucide-react';
import commonStyles from './ProjectDetails.common.module.css';
import lightStyles from './ProjectDetails.light.module.css';
import darkStyles from './ProjectDetails.dark.module.css';

interface ProjectDetailsProps {
  projectId: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  budget: number;
  budget_type?: string;
  status: string;
  category?: string;
  skills?: string[];
  created_at: string;
  client_id: number;
  proposals_count?: number;
  client?: {
    id: number;
    name: string;
    avatar_url?: string;
    location?: string;
    rating?: number;
    jobs_posted?: number;
  };
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ projectId }) => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await projectsApi.get(parseInt(projectId));
        
        // If client data isn't included, fetch it separately
        if (data && !data.client && data.client_id) {
          try {
            const clientData = await usersApi.get(data.client_id);
            data.client = clientData;
          } catch {
            // Client data fetch failed, continue without it
          }
        }
        
        setProject(data as Project);
      } catch (err: any) {
        console.error('Failed to fetch project:', err);
        setError(err.message || 'Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleSubmitProposal = () => {
    router.push(`/freelancer/submit-proposal?project_id=${projectId}`);
  };

  const formatBudget = (budget: number, budgetType?: string) => {
    if (budgetType === 'hourly') {
      return `$${budget}/hr`;
    }
    return `$${budget.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.error}>
          <AlertCircle size={48} />
          <h2>Project Not Found</h2>
          <p>{error || 'The requested project could not be found.'}</p>
          <Button variant="primary" onClick={() => router.push('/freelancer/projects')}>
            Browse Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={styles.pageContainer}>
        <main className={styles.mainContent}>
          <ScrollReveal>
            <header className={styles.header}>
              <h1 className={styles.title}>{project.title}</h1>
              <div className={styles.tagContainer}>
                {project.skills?.map(tag => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
                {project.category && (
                  <span className={styles.categoryTag}>{project.category}</span>
                )}
              </div>
            </header>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Project Description</h2>
              <div className={styles.description}>
                {project.description.split('\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </section>
          </ScrollReveal>
        </main>

        <aside className={styles.sidebar}>
          <ScrollReveal delay={0.2}>
            <div className={styles.sidebarCard}>
              <Button 
                variant="primary" 
                fullWidth 
                onClick={handleSubmitProposal}
                isLoading={submitting}
              >
                Submit a Proposal
              </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className={styles.sidebarCard}>
              <h3 className={styles.sectionTitle}>About the Client</h3>
              <div className={styles.clientInfo}>
                <UserAvatar 
                  name={project.client?.name || 'Client'} 
                  src={project.client?.avatar_url} 
                />
                <span className={styles.clientName}>{project.client?.name || 'Client'}</span>
              </div>
              <ul className={styles.detailsList}>
                {project.client?.rating && (
                  <li className={styles.detailsItem}>
                    <span className={styles.detailsLabel}>
                      <Star size={16} /> Rating
                    </span>
                    <span className={styles.detailsValue}>{project.client.rating.toFixed(1)} / 5</span>
                  </li>
                )}
                {project.client?.location && (
                  <li className={styles.detailsItem}>
                    <span className={styles.detailsLabel}>
                      <MapPin size={16} /> Location
                    </span>
                    <span className={styles.detailsValue}>{project.client.location}</span>
                  </li>
                )}
                {project.client?.jobs_posted !== undefined && (
                  <li className={styles.detailsItem}>
                    <span className={styles.detailsLabel}>
                      <Briefcase size={16} /> Jobs Posted
                    </span>
                    <span className={styles.detailsValue}>{project.client.jobs_posted}</span>
                  </li>
                )}
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.4}>
            <div className={styles.sidebarCard}>
              <h3 className={styles.sectionTitle}>Project Details</h3>
              <ul className={styles.detailsList}>
                <li className={styles.detailsItem}>
                  <span className={styles.detailsLabel}>
                    <DollarSign size={16} /> Budget
                  </span>
                  <span className={styles.detailsValue}>
                    {formatBudget(project.budget, project.budget_type)}
                  </span>
                </li>
                <li className={styles.detailsItem}>
                  <span className={styles.detailsLabel}>
                    <Clock size={16} /> Posted
                  </span>
                  <span className={styles.detailsValue}>{formatDate(project.created_at)}</span>
                </li>
                <li className={styles.detailsItem}>
                  <span className={styles.detailsLabel}>
                    <Users size={16} /> Proposals
                  </span>
                  <span className={styles.detailsValue}>{project.proposals_count || 0}</span>
                </li>
              </ul>
            </div>
          </ScrollReveal>
        </aside>
      </div>
    </PageTransition>
  );
};

export default ProjectDetails;
