// @AI-HINT: This is the layout for the freelancer settings pages. It uses a consistent, premium two-column layout with a route-aware sidebar.
'use client';

import React from 'react';
import SettingsLayout from '@/app/Settings/components/SettingsLayout/SettingsLayout';
import FreelancerSettingsSidebarNav from './components/FreelancerSettingsSidebarNav/FreelancerSettingsSidebarNav';

const sidebarNavItems = [
  { title: 'Account', href: '/freelancer/settings' },
  { title: 'Password', href: '/freelancer/settings/password' },
  { title: 'Notifications', href: '/freelancer/settings/notifications' },
];

interface FreelancerSettingsLayoutProps {
  children: React.ReactNode;
}

export default function FreelancerSettingsLayout({ children }: FreelancerSettingsLayoutProps) {
  return (
    <SettingsLayout sidebar={<FreelancerSettingsSidebarNav items={sidebarNavItems} />}>
      {children}
    </SettingsLayout>
  );
}
