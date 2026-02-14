// @AI-HINT: This is the Profile page root component for clients/admins. Uses API for data and 3-file CSS pattern.
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import UserAvatar from '../components/UserAvatar/UserAvatar';
import ProjectCard, { ProjectCardProps } from '../components/ProjectCard/ProjectCard';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import commonStyles from './Profile.common.module.css';
import lightStyles from './Profile.light.module.css';
import darkStyles from './Profile.dark.module.css';
import api from '@/lib/api';

interface ApiUser {
  id: number;
  email: string;
  full_name?: string;
  bio?: string;
  role?: string;
  profile_picture_url?: string;
  headline?: string;
  location?: string;
  phone_number?: string;
  linkedin_url?: string;
  github_url?: string;
  website_url?: string;
  twitter_url?: string;
}

interface ApiProject {
  id: number;
  title: string;
  status: string;
  budget_min?: number;
  budget_max?: number;
  created_at?: string;
  updated_at?: string;
  category?: string;
}

const Profile: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [projects, setProjects] = useState<ProjectCardProps[]>([]);
  const [error, setError] = useState<string | null>(null);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const fetchUserProfile = useCallback(async () => {
    try {
      const data: ApiUser = await api.auth.me() as any;
      setUser(data);
      // Fetch user's projects
      await fetchUserProjects();
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      if (err.message.includes('401')) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserProjects = async () => {
    try {
      const data: any = await api.projects.getMyProjects();
      // Ensure data is an array
      const projectsList = Array.isArray(data) ? data : [];
      
      const mappedProjects: ProjectCardProps[] = projectsList.slice(0, 5).map((p: ApiProject) => ({
        id: String(p.id),
        title: p.title,
        status: p.status === 'open' ? 'Pending' : p.status === 'in_progress' ? 'In Progress' : 'Completed',
        progress: p.status === 'completed' ? 100 : p.status === 'in_progress' ? 50 : 0,
        budget: p.budget_max || p.budget_min || 0,
        paid: 0,
        freelancers: [],
        updatedAt: p.updated_at ? new Date(p.updated_at).toLocaleDateString() : 'Recently',
        clientName: 'You',
        postedTime: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recently',
        tags: p.category ? [p.category] : [],
      }));
      setProjects(mappedProjects);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  if (!resolvedTheme) {
    return null; // Prevent hydration mismatch
  }

  if (loading) {
    return (
      <div className={cn(commonStyles.page, themeStyles.page)}>
        <div className={cn(commonStyles.container, commonStyles.loadingContainer, themeStyles.loadingContainer)}>
          <div className={commonStyles.spinner}></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(commonStyles.page, themeStyles.page)}>
        <div className={cn(commonStyles.container, commonStyles.errorContainer, themeStyles.errorContainer)}>
          <span className={commonStyles.errorIcon}>⚠️</span>
          <p>{error}</p>
          <button 
            className={cn(commonStyles.retryButton, themeStyles.retryButton)}
            onClick={() => router.push('/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.page, themeStyles.page)}>
        <div className={commonStyles.container}>
          <ScrollReveal>
            <header className={cn(commonStyles.header, themeStyles.header)}>
              <UserAvatar 
                name={user?.full_name || 'User'} 
                src={user?.profile_picture_url} 
                size="large" 
              />
              <div className={commonStyles.headerInfo}>
                <h1 className={cn(commonStyles.name, themeStyles.name)}>
                  {user?.full_name || 'Your Name'}
                </h1>
                {user?.headline && (
                  <p style={{ fontSize: '1.05rem', fontWeight: 500, opacity: 0.85, margin: '2px 0 4px' }}>
                    {user.headline}
                  </p>
                )}
                <p className={cn(commonStyles.bio, themeStyles.bio)}>
                  {user?.bio || 'Add a bio to tell others about yourself.'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <span className={cn(commonStyles.role, themeStyles.role)}>
                    {user?.role === 'client' ? '👔 Client' : user?.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                  </span>
                  {user?.location && (
                    <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>📍 {user.location}</span>
                  )}
                </div>
                {(user?.linkedin_url || user?.github_url || user?.website_url || user?.twitter_url) && (
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {user.linkedin_url && <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#4573df' }}>LinkedIn</a>}
                    {user.github_url && <a href={user.github_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#4573df' }}>GitHub</a>}
                    {user.twitter_url && <a href={user.twitter_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#4573df' }}>Twitter</a>}
                    {user.website_url && <a href={user.website_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#4573df' }}>Website</a>}
                  </div>
                )}
              </div>
            </header>
          </ScrollReveal>
          
          <main className={commonStyles.content}>
            <ScrollReveal delay={0.1}>
              <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                {user?.role === 'client' ? 'Your Projects' : 'Recent Activity'}
              </h2>
            </ScrollReveal>
            
            {projects.length > 0 ? (
              <StaggerContainer className={commonStyles.projectsGrid}>
                {projects.map((project) => (
                  <StaggerItem key={project.id}>
                    <ProjectCard {...project} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            ) : (
              <ScrollReveal delay={0.2}>
                <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                  <span className={commonStyles.emptyIcon}>📋</span>
                  <h3>No Projects Yet</h3>
                  <p>
                    {user?.role === 'client' 
                      ? 'Post your first project to start hiring talented freelancers.'
                      : 'Your project activity will appear here.'}
                  </p>
                </div>
              </ScrollReveal>
            )}
          </main>
        </div>
      </div>
    </PageTransition>
  );
};

export default Profile;
