// @AI-HINT: This is the comprehensive Home page showcasing MegiLance's AI-powered freelancing platform with blockchain integration. Maximum scope implementation with premium sections and Dora-style 3D scroll animations.

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

// Import 3D Scroll Scene components for Dora-style animations
import {
  ScrollScene3D,
  ScrollReveal3D,
  SectionDivider3D,
  ScrollProgressIndicator,
  ParallaxLayer,
} from '@/app/components/3D';

import commonStyles from './Home.common.module.css';
import lightStyles from './Home.light.module.css';
import darkStyles from './Home.dark.module.css';

const Home: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <ScrollScene3D className={cn(commonStyles.homePage, themeStyles.homePage)}>
      {/* Scroll Progress Indicator */}
      <ScrollProgressIndicator position="right" />

      {/* Background Parallax Layers */}
      <ParallaxLayer depth={3} className={commonStyles.parallaxBackground}>
        <div className={cn(commonStyles.gradientOrb, commonStyles.orb1, themeStyles.gradientOrb)} />
        <div className={cn(commonStyles.gradientOrb, commonStyles.orb2, themeStyles.gradientOrb)} />
        <div className={cn(commonStyles.gradientOrb, commonStyles.orb3, themeStyles.gradientOrb)} />
      </ParallaxLayer>

      <div className={commonStyles.pageContent}>
        {/* Hero Section - No wrapper needed, has its own 3D */}
        <Hero />

        {/* Trust Indicators with slide-up reveal */}
        <ScrollReveal3D animation="slideUp" delay={0.1}>
          <div className={commonStyles.homeSection}>
            <div className={commonStyles.sectionContainer}>
              <TrustIndicators />
            </div>
          </div>
        </ScrollReveal3D>

        {/* Section Divider */}
        <SectionDivider3D variant="wave" />

        {/* Why MegiLance with scale reveal */}
        <ScrollReveal3D animation="scale" delay={0.15}>
          <div className={commonStyles.homeSection}>
            <WhyMegiLance />
          </div>
        </ScrollReveal3D>

        {/* Features with fade-in */}
        <ScrollReveal3D animation="fadeIn" delay={0.1}>
          <div className={commonStyles.homeSection}>
            <div className={commonStyles.sectionContainer}>
              <Features />
            </div>
          </div>
        </ScrollReveal3D>

        {/* Section Divider */}
        <SectionDivider3D variant="gradient" />

        {/* How It Works with slide-left */}
        <ScrollReveal3D animation="slideLeft" delay={0.1}>
          <div className={commonStyles.homeSection}>
            <div className={commonStyles.sectionContainer}>
              <HowItWorks />
            </div>
          </div>
        </ScrollReveal3D>

        {/* AI Showcase with rotate reveal */}
        <ScrollReveal3D animation="rotate" delay={0.15}>
          <div className={commonStyles.homeSection}>
            <div className={commonStyles.sectionContainer}>
              <AIShowcase />
            </div>
          </div>
        </ScrollReveal3D>

        {/* Section Divider */}
        <SectionDivider3D variant="dots" />

        {/* Powered By AI with scale */}
        <ScrollReveal3D animation="scale" delay={0.1}>
          <div className={commonStyles.homeSection}>
            <div className={commonStyles.sectionContainer}>
              <PoweredByAI />
            </div>
          </div>
        </ScrollReveal3D>

        {/* Blockchain Showcase with flip */}
        <ScrollReveal3D animation="flip" delay={0.15}>
          <div className={commonStyles.homeSection}>
            <div className={commonStyles.sectionContainer}>
              <BlockchainShowcase />
            </div>
          </div>
        </ScrollReveal3D>

        {/* Section Divider */}
        <SectionDivider3D variant="wave" />

        {/* Product Screenshots with slide-up */}
        <ScrollReveal3D animation="slideUp" delay={0.1}>
          <div className={commonStyles.homeSection}>
            <div className={commonStyles.sectionContainer}>
              <ProductScreenshots />
            </div>
          </div>
        </ScrollReveal3D>

        {/* Global Impact with fade-in */}
        <ScrollReveal3D animation="fadeIn" delay={0.15}>
          <div className={commonStyles.homeSection}>
            <div className={commonStyles.sectionContainer}>
              <GlobalImpact />
            </div>
          </div>
        </ScrollReveal3D>

        {/* Section Divider */}
        <SectionDivider3D variant="gradient" />

        {/* Testimonials with scale */}
        <ScrollReveal3D animation="scale" delay={0.1}>
          <div className={commonStyles.homeSection}>
            <div className={commonStyles.sectionContainer}>
              <Testimonials />
            </div>
          </div>
        </ScrollReveal3D>

        {/* CTA with slide-up */}
        <ScrollReveal3D animation="slideUp" delay={0.1}>
          <div className={commonStyles.homeSection}>
            <div className={commonStyles.sectionContainer}>
              <CTA />
            </div>
          </div>
        </ScrollReveal3D>
      </div>
    </ScrollScene3D>
  );
};

export default Home;