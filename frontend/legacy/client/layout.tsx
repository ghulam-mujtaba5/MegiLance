// @AI-HINT: This is the layout for the client portal. It uses the AppLayout component to provide a consistent shell with a sidebar and navbar.

import React from 'react';
import DashboardLayout from '@/app/layouts/DashboardLayout';

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DashboardLayout userType="client">{children}</DashboardLayout>;
}
