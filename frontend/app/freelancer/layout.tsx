// @AI-HINT: This layout uses the shared AppLayout so freelancer portal matches client/admin shell (Sidebar + in-app Navbar, no public header/footer).
import React from 'react';
import AppLayout from '../components/AppLayout/AppLayout';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return <AppLayout>{children}</AppLayout>;
}
