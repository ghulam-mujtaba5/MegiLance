// @AI-HINT: This is the public site layout wrapper. It uses PublicLayout to provide the shared Header/Footer and skip links for marketing pages.

import React from 'react';
import PublicLayout from '../layouts/PublicLayout/PublicLayout';

export default function MainLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <PublicLayout>
      {children}
    </PublicLayout>
  );
}
