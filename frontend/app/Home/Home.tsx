// @AI-HINT: This is the comprehensive Home page showcasing MegiLance's AI-powered freelancing platform with blockchain integration. Maximum scope implementation with premium sections.

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

// Import all the components that make up the home page
import Hero from './components/Hero';
import TrustIndicators from './components/TrustIndicators';
import WhyMegiLance from './components/WhyMegiLance';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import AIShowcase from './components/AIShowcase';
import PoweredByAI from './components/PoweredByAI';
import BlockchainShowcase from './components/BlockchainShowcase';
import ProductScreenshots from './components/ProductScreenshots';
import GlobalImpact from './components/GlobalImpact';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';

import commonStyles from './Home.common.module.css';
import lightStyles from './Home.light.module.css';
import darkStyles from './Home.dark.module.css';

const Home: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.homePage, themeStyles.homePage)}>
      {/* Background Parallax Layers */}
      <div className={commonStyles.parallaxBackground}>
        <div className={cn(commonStyles.gradientOrb, commonStyles.orb1, themeStyles.gradientOrb)} />
        <div className={cn(commonStyles.gradientOrb, commonStyles.orb2, themeStyles.gradientOrb)} />
        <div className={cn(commonStyles.gradientOrb, commonStyles.orb3, themeStyles.gradientOrb)} />
      </div>

      <div className={commonStyles.pageContent}>
        {/* Hero Section */}
        <Hero />

        {/* Trust Indicators */}
        <div className={commonStyles.homeSection}>
          <div className={commonStyles.sectionContainer}>
            <TrustIndicators />
          </div>
        </div>

        {/* Why MegiLance */}
        <div className={commonStyles.homeSection}>
          <WhyMegiLance />
        </div>

        {/* Features */}
        <div className={commonStyles.homeSection}>
          <div className={commonStyles.sectionContainer}>
            <Features />
          </div>
        </div>

        {/* How It Works */}
        <div className={commonStyles.homeSection}>
          <div className={commonStyles.sectionContainer}>
            <HowItWorks />
          </div>
        </div>

        {/* AI Showcase */}
        <div className={commonStyles.homeSection}>
          <div className={commonStyles.sectionContainer}>
            <AIShowcase />
          </div>
        </div>

        {/* Powered By AI */}
        <div className={commonStyles.homeSection}>
          <div className={commonStyles.sectionContainer}>
            <PoweredByAI />
          </div>
        </div>

        {/* Blockchain Showcase */}
        <div className={commonStyles.homeSection}>
          <div className={commonStyles.sectionContainer}>
            <BlockchainShowcase />
          </div>
        </div>

        {/* Product Screenshots */}
        <div className={commonStyles.homeSection}>
          <div className={commonStyles.sectionContainer}>
            <ProductScreenshots />
          </div>
        </div>

        {/* Global Impact */}
        <div className={commonStyles.homeSection}>
          <div className={commonStyles.sectionContainer}>
            <GlobalImpact />
          </div>
        </div>

        {/* Testimonials */}
        <div className={commonStyles.homeSection}>
          <div className={commonStyles.sectionContainer}>
            <Testimonials />
          </div>
        </div>

        {/* CTA */}
        <div className={commonStyles.homeSection}>
          <div className={commonStyles.sectionContainer}>
            <CTA />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;