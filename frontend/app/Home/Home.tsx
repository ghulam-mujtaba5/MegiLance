// @AI-HINT: This is the comprehensive Home page showcasing MegiLance's AI-powered freelancing platform with blockchain integration. Maximum scope implementation with premium sections.
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import Header from '@/app/components/Header/Header';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import Hero from './components/Hero';


import Features from './components/Features';
import AIShowcase from './components/AIShowcase';
import BlockchainShowcase from './components/BlockchainShowcase';
import HowItWorks from './components/HowItWorks';
import GlobalImpact from './components/GlobalImpact';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';

import commonStyles from './Home.common.module.css';
import lightStyles from './Home.light.module.css';
import darkStyles from './Home.dark.module.css';

const Home: React.FC = () => {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.homePage, themeStyles.homePage)}>
      <Header />
      <main className={commonStyles.homeContainer}>
        {/* Enhanced Hero Section with Animated Stats */}
        <section className={commonStyles.homeSection}>
          <Hero />
        </section>
        {/* Core Platform Features */}
        <section className={commonStyles.homeSection}>
          <Features />
        </section>
        {/* AI-Powered Capabilities Showcase */}
        <section className={commonStyles.homeSection}>
          <AIShowcase />
        </section>
        {/* Blockchain & Crypto Payment Features */}
        <section className={commonStyles.homeSection}>
          <BlockchainShowcase />
        </section>
        {/* How the Platform Works */}
        <section className={commonStyles.homeSection}>
          <HowItWorks />
        </section>
        {/* Global Impact & Pakistani Focus */}
        <section className={commonStyles.homeSection}>
          <GlobalImpact />
        </section>
        {/* User Testimonials */}
        <section className={commonStyles.homeSection}>
          <Testimonials />
        </section>
        {/* Final Call-to-Action */}
        <section>
          <CTA />
        </section>
      </main>
    </div>
  );
};

export default Home;

