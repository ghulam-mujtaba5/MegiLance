// @AI-HINT: Premium SaaS Dashboard component for MegiLance platform. This is the main dashboard interface that serves three user roles (Admin, Client, Freelancer) with investor-grade UI quality. Features comprehensive metrics, activity feeds, project management, and responsive design following exact MegiLance brand guidelines. Uses per-component CSS architecture with .common.css, .light.css, .dark.css theming. Designed to match quality standards of Linear, Vercel, GitHub, and Upwork Pro.

import React from 'react';

// Core Layout Components
import Sidebar from '@/app/components/Sidebar/Sidebar';
import SidebarNav, { NavItem as SidebarNavItem } from '@/app/components/Sidebar/SidebarNav';
import Navbar, { NavItem as NavbarNavItem } from '@/app/components/Navbar/Navbar';
import { ProfileMenuItem } from '@/app/components/ProfileMenu/ProfileMenu';

// Modular Dashboard Components
import DashboardHeader from './components/DashboardHeader/DashboardHeader';
import DashboardMetrics from './components/DashboardMetrics/DashboardMetrics';
import DashboardRecentProjects from './components/DashboardRecentProjects/DashboardRecentProjects';
import DashboardActivityFeed from './components/DashboardActivityFeed/DashboardActivityFeed';

// Data and Types

// Icons
import {
  FaTachometerAlt, FaBriefcase, FaComments, FaCreditCard, FaUsers, FaChartBar,
  FaClipboardCheck, FaCogs, FaUserEdit, FaFileSignature, FaUniversity, FaUser, FaSignOutAlt
} from 'react-icons/fa';

// Styles
import './dashboard.common.css';
import './dashboard.light.css';
import './dashboard.dark.css';

interface User {
  fullName: string;
  email: string;
  bio: string;
  avatar: string;
  notificationCount: number;
}

interface DashboardProps {
  userRole?: 'admin' | 'client' | 'freelancer';
  user: User;
}



const navItems: NavbarNavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Projects', href: '/projects' },
  { label: 'Tasks', href: '/tasks' },
  { label: 'Team', href: '/team' },
];

const profileMenuItems: ProfileMenuItem[] = [
  { label: 'My Profile', href: '/profile', icon: <FaUser /> },
  { label: 'Settings', href: '/settings', icon: <FaCogs /> },
  { label: 'Logout', onClick: () => alert('Logging out...'), icon: <FaSignOutAlt /> },
];

// Role-based sidebar navigation logic
const getSidebarNavItems = (role: string): SidebarNavItem[] => {
  const baseItems: SidebarNavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: FaTachometerAlt, active: true },
    { href: '/projects', label: 'Projects', icon: FaBriefcase },
    { href: '/messages', label: 'Messages', icon: FaComments },
    { href: '/payments', label: 'Payments', icon: FaCreditCard },
  ];

  if (role === 'admin') {
    return [
      ...baseItems,
      { href: '/admin/users', label: 'User Management', icon: FaUsers },
      { href: '/admin/analytics', label: 'Analytics', icon: FaChartBar },
      { href: '/admin/audit', label: 'Audit Logs', icon: FaClipboardCheck },
      { href: '/settings', label: 'Settings', icon: FaCogs },
    ];
  }

  if (role === 'client') {
    return [
      ...baseItems,
      { href: '/client/hire', label: 'Hire Freelancers', icon: FaUserEdit },
      { href: '/client/reviews', label: 'Reviews', icon: FaFileSignature },
      { href: '/settings', label: 'Settings', icon: FaCogs },
    ];
  }

  // Freelancer role
  return [
    ...baseItems,
    { href: '/freelancer/portfolio', label: 'Portfolio', icon: FaUniversity },
    { href: '/freelancer/proposals', label: 'Proposals', icon: FaFileSignature },
    { href: '/settings', label: 'Settings', icon: FaCogs },
  ];
};

const Dashboard: React.FC<DashboardProps> = ({ userRole = 'freelancer', user }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const sidebarNavItems = getSidebarNavItems(userRole);

  return (
    <div className={`Dashboard Dashboard--${userRole} ${isSidebarCollapsed ? 'Dashboard--sidebar-collapsed' : ''}`}>
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={setIsSidebarCollapsed}>
        <SidebarNav navItems={sidebarNavItems} />
      </Sidebar>
      <div className="Dashboard-main-content">
        <Navbar
          navItems={navItems}
          profileMenuItems={profileMenuItems}
          user={user}
        />
        <main className="Dashboard-content">
          <DashboardHeader userRole={userRole} user={user} />
          <DashboardMetrics />
          <div className="Dashboard-main-grid">
            <DashboardRecentProjects />
            <DashboardActivityFeed />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;