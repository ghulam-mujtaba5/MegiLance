// @AI-HINT: This layout file applies the custom FreelancerLayout to all pages within the /freelancer route group, providing a consistent sidebar and content structure.
import React from 'react';
import FreelancerLayout from './layouts/FreelancerLayout/FreelancerLayout';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return <FreelancerLayout>{children}</FreelancerLayout>;
}
