// @AI-HINT: This is the main layout for the authenticated application. It uses the AppLayout component to provide a consistent shell with a sidebar and navbar.

import React from 'react';
import AppLayout from '../components/AppLayout/AppLayout';

export default function MainLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}
