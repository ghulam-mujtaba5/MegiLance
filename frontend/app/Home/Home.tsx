// @AI-HINT: This is the comprehensive Home page showcasing MegiLance's AI-powered freelancing platform with blockchain integration. Maximum scope implementation with premium sections.
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
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
    <div className={cn(commonStyles.homeContainer, themeStyles.home)}>


      {/* Enhanced Hero Section with Animated Stats */}
      <Hero />

      {/* Core Platform Features */}
      <Features />

      {/* AI-Powered Capabilities Showcase */}
      <AIShowcase />

      {/* Blockchain & Crypto Payment Features */}
      <BlockchainShowcase />

      {/* How the Platform Works */}
      <HowItWorks />

      {/* Global Impact & Pakistani Focus */}
      <GlobalImpact />

      {/* User Testimonials */}
      <Testimonials />

      {/* Final Call-to-Action */}
      <CTA />


    </div>
  );
};

export default Home;

