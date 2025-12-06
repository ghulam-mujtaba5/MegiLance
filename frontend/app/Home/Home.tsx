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
import PoweredByAI from './components/PoweredByAI';
import BlockchainShowcase from './components/BlockchainShowcase';
import SuccessStories from './components/SuccessStories';
import GlobalImpact from './components/GlobalImpact';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import { ScrollReveal } from '../components/Animations/ScrollReveal';
import { PageTransition } from '../components/Animations/PageTransition';
import GlobeBackground from '../components/Animations/GlobeBackground';

import commonStyles from './Home.common.module.css';
import lightStyles from './Home.light.module.css';
import darkStyles from './Home.dark.module.css';

const Home: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.homePage, themeStyles.homePage)}>
        {/* Background Parallax Layers */}
        <div className={commonStyles.parallaxBackground}>
          <GlobeBackground />
          <div className={cn(commonStyles.gradientOrb, commonStyles.orb1, themeStyles.gradientOrb)} />
          <div className={cn(commonStyles.gradientOrb, commonStyles.orb2, themeStyles.gradientOrb)} />
          <div className={cn(commonStyles.gradientOrb, commonStyles.orb3, themeStyles.gradientOrb)} />
        </div>

        <div className={commonStyles.pageContent}>
          {/* Hero Section */}
          <ScrollReveal width="100%" direction="none" duration={0.8}>
            <Hero />
          </ScrollReveal>

        {/* Trust Indicators */}
        <div className={commonStyles.homeSection}>
          <div className={commonStyles.sectionContainer}>
            <ScrollReveal width="100%" delay={0.2}>
              <TrustIndicators />
            </ScrollReveal>
          </div>
        </div>

        {/* Why MegiLance */}
        <div className={commonStyles.homeSection}>
          <ScrollReveal width="100%" direction="left">
            <WhyMegiLance />
          </ScrollReveal>
        </div>

        {/* Features */}
        <div className={commonStyles.homeSection}>
          <div className={commonStyles.sectionContainer}>
            <ScrollReveal width="100%" direction="right">
              <Features />
            </ScrollReveal>
          </div>
        </div>

        {/* How It Works */}
        <div className={commonStyles.homeSection}>
          <div className={commonStyles.sectionContainer}>
            <ScrollReveal width="100%" direction="up">
              <HowItWorks />
            </ScrollReveal>
          </div>
        </div>

        {/* Powered By AI */}
        <div className={commonStyles.homeSection}>
          <div className={commonStyles.sectionContainer}>
            <ScrollReveal width="100%" direction="up">
              <PoweredByAI />
            </ScrollReveal>
          </div>
        </div>

        {/* Blockchain Showcase */}
        <div className={commonStyles.homeSection}>
          <div className={commonStyles.sectionContainer}>
            <ScrollReveal width="100%" direction="left">
              <BlockchainShowcase />
            </ScrollReveal>
          </div>
        </div>

        {/* Success Stories */}
        <div className={commonStyles.homeSection}>
          <div className={commonStyles.sectionContainer}>
            <ScrollReveal width="100%" direction="up">
              <SuccessStories />
            </ScrollReveal>
          </div>
        </div>

        {/* Global Impact */}
        <div className={commonStyles.homeSection}>
          <div className={commonStyles.sectionContainer}>
            <ScrollReveal width="100%" direction="up">
              <GlobalImpact />
            </ScrollReveal>
          </div>
        </div>

        {/* Testimonials */}
        <div className={commonStyles.homeSection}>
          <div className={commonStyles.sectionContainer}>
            <ScrollReveal width="100%" direction="up">
              <Testimonials />
            </ScrollReveal>
          </div>
        </div>

          {/* CTA */}
          <div className={commonStyles.homeSection}>
            <div className={commonStyles.sectionContainer}>
              <ScrollReveal width="100%" direction="up" delay={0.2}>
                <CTA />
              </ScrollReveal>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};export default Home;