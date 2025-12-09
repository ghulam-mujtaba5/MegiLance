// @AI-HINT: AI section layout with navigation header to prevent UI clipping issues
'use client';

import React from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';

interface AILayoutProps {
  children: React.ReactNode;
}

export default function AILayout({ children }: AILayoutProps) {
  return (
    <>
      <Header />
      <div className="min-h-screen pt-16">
        {children}
      </div>
      <Footer />
    </>
  );
}
