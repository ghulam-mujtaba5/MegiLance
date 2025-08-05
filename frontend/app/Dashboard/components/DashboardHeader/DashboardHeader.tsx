// @AI-HINT: This component renders the header for the main dashboard. It's designed to be a reusable and focused component, following premium SaaS development practices by separating concerns. It includes the welcome title, subtitle, and primary actions like notifications.

import React from 'react';
import { FaBell } from 'react-icons/fa';
import './DashboardHeader.common.css';
import './DashboardHeader.light.css';
import './DashboardHeader.dark.css';

interface DashboardHeaderProps {
  userName: string;
  userRole: 'admin' | 'client' | 'freelancer';
  notificationCount: number;
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

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName, userRole, notificationCount }) => {
  return (
    <div className="DashboardHeader">
      <div className="DashboardHeader-welcome">
        <h1 className="DashboardHeader-title">Welcome back, {userName}!</h1>
        <p className="DashboardHeader-subtitle">{getWelcomeMessage(userRole)}</p>
      </div>
      <div className="DashboardHeader-actions">
        <button className="DashboardHeader-notification-btn" aria-label={`View ${notificationCount} notifications`}>
          <FaBell className="DashboardHeader-notification-icon" />
          {notificationCount > 0 && (
            <span className="DashboardHeader-notification-badge">{notificationCount}</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
