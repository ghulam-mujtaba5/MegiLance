// @AI-HINT: AI section layout with navigation header to prevent UI clipping issues
'use client';

import React from 'react';
import PublicHeader from '../components/Layout/PublicHeader/PublicHeader';
import Footer from '../components/Footer/Footer';

interface AILayoutProps {
  children: React.ReactNode;
}

export default function AILayout({ children }: AILayoutProps) {
  return (
    <>
      <PublicHeader />
      <div className="min-h-screen pt-16">
        {children}
      </div>
      <Footer />
    </>
  );
}
