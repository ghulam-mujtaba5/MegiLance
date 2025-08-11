// @AI-HINT: This is the Profile page root component. All styles are per-component only. See Profile.common.css, Profile.light.css, and Profile.dark.css for theming.
'use client';

import React from 'react';
import UserAvatar from '../components/UserAvatar/UserAvatar';
import ProjectCard, { ProjectCardProps } from '../components/ProjectCard/ProjectCard';
import commonStyles from './Profile.common.module.css';
import lightStyles from './Profile.light.module.css';
import darkStyles from './Profile.dark.module.css';

interface ProfileProps {
  theme?: 'light' | 'dark';
}

const Profile: React.FC<ProfileProps> = ({ theme = 'light' }) => {
  const mockUser = {
    name: 'Jane Doe',
    bio: 'Freelance UI/UX Designer specializing in modern web applications. Passionate about creating intuitive and beautiful user experiences.',
    avatarUrl: '', // Placeholder
  };

  const mockProjects: ProjectCardProps[] = [
    {
      id: '1',
      title: 'E-commerce Platform Redesign',
      status: 'In Progress',
      progress: 50,
      budget: 25000,
      paid: 10000,
      freelancers: [],
      updatedAt: 'Just now',
      clientName: 'Global Retail Inc.',
      postedTime: 'Just now',
      tags: ['Design', 'Web'],
    },
    {
      id: '2',
      title: 'Data Analytics Dashboard',
      status: 'In Progress',
      progress: 30,
      budget: 18000,
      paid: 5000,
      freelancers: [],
      updatedAt: '2 days ago',
      clientName: 'Tech Solutions LLC',
      postedTime: '2 days ago',
      tags: ['Design', 'Web'],
    },
  ];

  return (
    <div className={`Profile Profile--${theme}`}>
      <header className="Profile-header">
        <UserAvatar name={mockUser.name} src={mockUser.avatarUrl} size="large" />
        <h1 className="Profile-name">{mockUser.name}</h1>
        <p className="Profile-bio">{mockUser.bio}</p>
      </header>
      <main className="Profile-content">
        <h2>Active Projects</h2>
        <div className="Profile-projects-list">
          {mockProjects.map((project) => (
            <ProjectCard
              key={project.id}
              {...project}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Profile;
