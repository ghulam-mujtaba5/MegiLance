// @AI-HINT: This is the main layout for the public-facing and core application pages. It includes the site-wide Header and Footer.

import React from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';

export default function MainLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}
