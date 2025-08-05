// @AI-HINT: This component renders the header for the main dashboard. It's designed to be a reusable and focused component, following premium SaaS development practices by separating concerns. It includes the welcome title, subtitle, and primary actions like notifications.

'use client';

import React, { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';

import './DashboardHeader.common.css';
import './DashboardHeader.light.css';
import './DashboardHeader.dark.css';

interface User {
  fullName: string;
  email: string;
  bio: string;
  avatar: string;
  notificationCount: number;
}

interface DashboardHeaderProps {
  userRole: 'admin' | 'client' | 'freelancer';
  user: User;
}

const getWelcomeMessage = (role: string) => {
  switch (role) {
    case 'admin':
      return 'Oversee and manage the platform.';
    case 'client':
      return 'Manage your projects and hiring.';
    case 'freelancer':
    default:
      return 'Here is your project and task overview.';
  }
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userRole, user }) => {
  
  return (
    <div className="DashboardHeader">
      <div className="DashboardHeader-welcome">
        <h1 className="DashboardHeader-title">Welcome back, {user.fullName}!</h1>
        <p className="DashboardHeader-subtitle">{getWelcomeMessage(userRole)}</p>
      </div>
      <div className="DashboardHeader-actions">
        <button className="DashboardHeader-notification-btn" aria-label={`View ${user.notificationCount} notifications`}>
          <FaBell className="DashboardHeader-notification-icon" />
          {user && user.notificationCount > 0 && (
            <span className="DashboardHeader-notification-badge">{user.notificationCount}</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
