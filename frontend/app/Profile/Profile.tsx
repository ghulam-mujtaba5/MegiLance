// @AI-HINT: This is the Profile page root component for clients/admins. Uses API for data and 3-file CSS pattern.
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import UserAvatar from '../components/UserAvatar/UserAvatar';
import ProjectCard, { ProjectCardProps } from '../components/ProjectCard/ProjectCard';
import commonStyles from './Profile.common.module.css';
import lightStyles from './Profile.light.module.css';
import darkStyles from './Profile.dark.module.css';

interface ApiUser {
  id: number;
  email: string;
  full_name?: string;
  bio?: string;
  role?: string;
  profile_picture_url?: string;
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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [projects, setProjects] = useState<ProjectCardProps[]>([]);
  const [error, setError] = useState<string | null>(null);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Please log in to view your profile');
        setLoading(false);
        return;
      }

      const response = await fetch('/backend/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: ApiUser = await response.json();
        setUser(data);
        // Fetch user's projects
        await fetchUserProjects(token);
      } else if (response.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Error loading profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserProjects = async (token: string) => {
    try {
      const response = await fetch('/backend/api/projects/my-projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: ApiProject[] = await response.json();
        const mappedProjects: ProjectCardProps[] = data.slice(0, 5).map((p) => ({
          id: String(p.id),
          title: p.title,
          status: p.status === 'open' ? 'Open' : p.status === 'in_progress' ? 'In Progress' : 'Completed',
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
      }
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
            onClick={() => window.location.href = '/login'}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.page, themeStyles.page)}>
      <div className={commonStyles.container}>
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
            <p className={cn(commonStyles.bio, themeStyles.bio)}>
              {user?.bio || 'Add a bio to tell others about yourself.'}
            </p>
            <span className={cn(commonStyles.role, themeStyles.role)}>
              {user?.role === 'client' ? '👔 Client' : user?.role === 'admin' ? '🛡️ Admin' : '👤 User'}
            </span>
          </div>
        </header>
        
        <main className={commonStyles.content}>
          <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
            {user?.role === 'client' ? 'Your Projects' : 'Recent Activity'}
          </h2>
          
          {projects.length > 0 ? (
            <div className={commonStyles.projectsGrid}>
              {projects.map((project) => (
                <ProjectCard key={project.id} {...project} />
              ))}
            </div>
          ) : (
            <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
              <span className={commonStyles.emptyIcon}>📋</span>
              <h3>No Projects Yet</h3>
              <p>
                {user?.role === 'client' 
                  ? 'Post your first project to start hiring talented freelancers.'
                  : 'Your project activity will appear here.'}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Profile;
