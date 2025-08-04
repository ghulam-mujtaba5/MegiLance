// @AI-HINT: Enterprise-grade Dashboard component for MegiLance platform. Features comprehensive metrics, activity feeds, project management, and responsive design following brand guidelines. Uses per-component CSS architecture with theme support.
import React from 'react';
import Navbar, { NavItem } from '@/app/components/Navbar/Navbar';
import { ProfileMenuItem } from '@/app/components/ProfileMenu/ProfileMenu';
import { FaBell, FaCog, FaUser, FaSignOutAlt } from 'react-icons/fa';
import SidebarNav from '@/app/components/SidebarNav/SidebarNav';
import DashboardWidget from '@/app/components/DashboardWidget/DashboardWidget';
import './dashboard.common.css';
import './dashboard.light.css';
import './dashboard.dark.css';

interface DashboardProps {
  theme?: 'light' | 'dark';
}

const user = { name: 'Alexia Christian', email: 'alexia.c@megilance.com' };

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Projects', href: '/projects' },
  { label: 'Tasks', href: '/tasks' },
  { label: 'Team', href: '/team' },
];

const profileMenuItems: ProfileMenuItem[] = [
  { label: 'My Profile', href: '/profile', icon: <FaUser /> },
  { label: 'Settings', href: '/settings', icon: <FaCog /> },
  { label: 'Logout', onClick: () => alert('Logging out...'), icon: <FaSignOutAlt /> },
];

const Dashboard: React.FC<DashboardProps> = ({ theme = 'light' }) => {
  const sidebarLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Projects', href: '/projects', icon: '💼' },
    { label: 'Messages', href: '/messages', icon: '💬' },
    { label: 'Payments', href: '/payments', icon: '💰' },
    { label: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  const recentProjects = [
    { id: 1, title: 'E-commerce Platform Redesign', client: 'TechCorp Inc.', status: 'In Progress', progress: 75, deadline: '2025-08-15', budget: '$5,200' },
    { id: 2, title: 'Mobile App Development', client: 'StartupXYZ', status: 'Review', progress: 90, deadline: '2025-08-10', budget: '$3,800' },
    { id: 3, title: 'Brand Identity Package', client: 'Creative Agency', status: 'Completed', progress: 100, deadline: '2025-08-05', budget: '$2,100' },
  ];

  const recentActivity = [
    { id: 1, message: 'Received payment from Innovate Inc.', time: '2h ago', amount: '+$15,000', icon: 'dollar-sign' },
    { id: 2, message: 'Task "Deploy to Staging" completed', time: '5h ago', icon: 'check-circle' },
    { id: 3, message: 'New project "Brand Redesign" created', time: '1d ago', icon: 'briefcase' },
    { id: 4, message: '@jane.doe joined the AI Dashboard team', time: '2d ago', icon: 'user-plus' },
  ];

  const quickActions = [
    { id: 1, label: 'Create Proposal', icon: '📝', action: 'proposal' },
    { id: 2, label: 'Browse Jobs', icon: '🔍', action: 'browse' },
    { id: 3, label: 'Withdraw Funds', icon: '🏦', action: 'withdraw' },
    { id: 4, label: 'Update Profile', icon: '👤', action: 'profile' },
  ];

  const metrics = [
    { id: 1, label: 'Active Projects', value: '12', icon: 'briefcase' },
    { id: 2, label: 'Pending Tasks', value: '8', icon: 'clipboard-check' },
    { id: 3, label: 'Team Members', value: '24', icon: 'users' },
    { id: 4, label: 'Revenue', value: '$45.8K', icon: 'chart-bar' },
  ];

  const logo = (
    <div className="flex items-center gap-2">
      <svg className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5-10 5z" />
      </svg>
      <span className="text-xl font-bold">MegiLance</span>
    </div>
  );

  const Icon = ({ name, className }: { name: string; className?: string }) => {
    const iconPaths: { [key: string]: React.ReactNode } = {
      briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></>,
      users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></>,
      user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></>,
      'logo-icon': <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>,
      // Add other icons here
    };

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`icon icon-${name} ${className || ''}`}
      >
        {iconPaths[name] || <circle cx="12" cy="12" r="10" />}{/* Fallback icon */}
      </svg>
    );
  };

  return (
    <div className={`Dashboard Dashboard--${theme}`}>
      <div className="Dashboard-container">
        <aside className="Dashboard-sidebar">
          <div className="Dashboard-logo">
            <h1 className="Dashboard-logo-text">MegiLance</h1>
            <span className="Dashboard-logo-badge">Pro</span>
          </div>
          <SidebarNav theme={theme} navItems={sidebarLinks} />
        </aside>
        
        <div className="Dashboard-main-wrapper">
          <Navbar
            theme={theme}
            navItems={navItems}
            profileMenuItems={profileMenuItems}
            userName={user.name}
            userEmail={user.email}
            logo={logo}
          />
          <main className="Dashboard-main">
            <header className="Dashboard-header">
              <div className="Dashboard-header-content">
                <div className="Dashboard-welcome">
                  <h2 className="Dashboard-title">Welcome back, {user.name.split(' ')[0]}!</h2>
                  <p className="Dashboard-subtitle">Here’s the latest on your projects.</p>
                </div>
                <div className="Dashboard-header-actions">
                  <button className="Dashboard-notification-btn">
                    <span className="Dashboard-notification-icon">🔔</span>
                    <span className="Dashboard-notification-badge">3</span>
                  </button>
                </div>
              </div>
            </header>

            <div className="Dashboard-content">
              {/* Key Metrics Section */}
              <section className="Dashboard-metrics">
                <div className="Dashboard-metrics-grid">
                  {metrics.map(metric => (
                    <div key={metric.id} className="Dashboard-card">
                      <Icon name={metric.icon} />
                      <span>{metric.label}</span>
                      <strong>{metric.value}</strong>
                    </div>
                  ))}
                </div>
              </section>

              {/* Quick Actions */}
              <section className="Dashboard-quick-actions">
                <h2 className="Dashboard-section-title">Quick Actions</h2>
                <div className="Dashboard-actions-grid">
                  {quickActions.map(action => (
                    <button key={action.id} className="Dashboard-card">
                      <Icon name={action.icon} />
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              <div className="Dashboard-content-grid">
                {/* Recent Projects */}
                <section className="Dashboard-projects">
                  <div className="Dashboard-section-header">
                    <h2 className="Dashboard-section-title">Recent Projects</h2>
                    <button className="Dashboard-section-action">View All</button>
                  </div>
                  <div className="Dashboard-projects-list">
                    {recentProjects.map(project => (
                      <div key={project.id} className="Dashboard-project-card">
                        <div className="Dashboard-project-header">
                          <h3 className="Dashboard-project-title">{project.title}</h3>
                          <span className={`Dashboard-project-status Dashboard-project-status--${project.status.toLowerCase().replace(' ', '-')}`}>
                            {project.status}
                          </span>
                        </div>
                        <div className="Dashboard-project-meta">
                          <span className="Dashboard-project-client">👤 {project.client}</span>
                          <span className="Dashboard-project-budget">💰 {project.budget}</span>
                          <span className="Dashboard-project-deadline">📅 {project.deadline}</span>
                        </div>
                        <div className="Dashboard-project-progress">
                          <div className="Dashboard-progress-bar">
                            <div 
                              className="Dashboard-progress-fill" 
                              data-progress={project.progress}
                            ></div>
                          </div>
                          <span className="Dashboard-progress-text">{project.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Recent Activity */}
                <section className="Dashboard-activity">
                  <div className="Dashboard-section-header">
                    <h2 className="Dashboard-section-title">Recent Activity</h2>
                    <button className="Dashboard-section-action">View All</button>
                  </div>
                  <div className="Dashboard-activity-list">
                    {recentActivity.map(item => (
                      <div key={item.id} className="Dashboard-activity-item">
                        <div className="Dashboard-activity-icon">{item.icon}</div>
                        <div className="Dashboard-activity-content">
                          <p className="Dashboard-activity-message">{item.message}</p>
                          <span className="Dashboard-activity-time">{item.time}</span>
                        </div>
                        {item.amount && (
                          <div className="Dashboard-activity-amount">{item.amount}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
