// @AI-HINT: Premium SaaS Dashboard page route for MegiLance platform. This is the Next.js route file that serves the main dashboard interface for three user roles (Admin, Client, Freelancer). Designed for investor-grade UI quality matching Linear, Vercel, GitHub standards.
'use client';

import React from 'react';
import Dashboard from './dashboard';

const DashboardPage = () => {
  // TODO: Get user role from authentication context or API
  // For now, defaulting to freelancer role
  const userRole = 'freelancer'; // This should come from auth context

  return <Dashboard userRole={userRole} />;
};

export default DashboardPage;
