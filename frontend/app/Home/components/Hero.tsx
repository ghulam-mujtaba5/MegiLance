// @AI-HINT: Enhanced Hero section with animated statistics and multiple CTAs for maximum impact

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/app/components/Button/Button';
import { FaRocket, FaPlay, FaShieldAlt, FaRobot, FaBitcoin, FaGlobe } from 'react-icons/fa';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './Hero.common.module.css';
import lightStyles from './Hero.light.module.css';
import darkStyles from './Hero.dark.module.css';

const Hero: React.FC = () => {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  const [animatedStats, setAnimatedStats] = useState({
    freelancers: 0,
    projects: 0,
    payments: 0,
    countries: 0
  });

  useEffect(() => {
    const targetStats = {
      freelancers: 50000,
      projects: 125000,
      payments: 2500000,
      countries: 45
    };

    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedStats({
        freelancers: Math.floor(targetStats.freelancers * progress),
        projects: Math.floor(targetStats.projects * progress),
        payments: Math.floor(targetStats.payments * progress),
        countries: Math.floor(targetStats.countries * progress)
      });

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className={cn(commonStyles.hero, themeStyles.hero)}>
      <div className={commonStyles.heroContainer}>
        <div className={commonStyles.heroContent}>
          {/* Main Hero Content */}
          <div className={commonStyles.heroMain}>
            <div className={cn(commonStyles.badge, themeStyles.badge)}>
              <FaRobot className={cn(commonStyles.badgeIcon, themeStyles.badgeIcon)} />
              <span>AI-Powered • Blockchain-Secured • Pakistan&apos;s #1 Platform</span>
            </div>
            
            <h1 className={cn(commonStyles.title, themeStyles.title)}>
              The Future of <span className={cn(commonStyles.titleHighlight, themeStyles.titleHighlight)}>Freelancing</span> is Here
            </h1>
            
            <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
              MegiLance revolutionizes freelance work with AI-powered job matching, 
              instant USDC payments, and blockchain-secured escrow. Built for Pakistani 
              talent, designed for global success.
            </p>

            <div className={commonStyles.featuresGrid}>
              <div className={cn(commonStyles.feature, themeStyles.feature)}>
                <FaRobot className={cn(commonStyles.featureIcon, themeStyles.featureIcon)} />
                <span>AI Smart Matching</span>
              </div>
              <div className={cn(commonStyles.feature, themeStyles.feature)}>
                <FaBitcoin className={cn(commonStyles.featureIcon, themeStyles.featureIcon)} />
                <span>Instant USDC Payments</span>
              </div>
              <div className={cn(commonStyles.feature, themeStyles.feature)}>
                <FaShieldAlt className={cn(commonStyles.featureIcon, themeStyles.featureIcon)} />
                <span>Blockchain Escrow</span>
              </div>
              <div className={cn(commonStyles.feature, themeStyles.feature)}>
                <FaGlobe className={cn(commonStyles.featureIcon, themeStyles.featureIcon)} />
                <span>Global Opportunities</span>
              </div>
            </div>

            <div className={commonStyles.cta}>
              <Link href="/Signup" className={commonStyles.ctaLink}>
                <Button variant="primary" size="large">
                  <FaRocket /> Start Earning Today
                </Button>
              </Link>
              <Link href="/watch-demo" className={cn(commonStyles.ctaLink, themeStyles.ctaLink)}>
                <Button variant="secondary" size="large">
                  <FaPlay /> Watch Demo
                </Button>
              </Link>
            </div>

            <div className={commonStyles.trustIndicators}>
              <span className={cn(commonStyles.trustText, themeStyles.trustText)}>Trusted by freelancers worldwide</span>
              <div className={cn(commonStyles.trustBadges, themeStyles.trustBadges)}>
                <div className={cn(commonStyles.trustBadge, themeStyles.trustBadge)}>256-bit SSL</div>
                <div className={cn(commonStyles.trustBadge, themeStyles.trustBadge)}>SOC 2 Compliant</div>
                <div className={cn(commonStyles.trustBadge, themeStyles.trustBadge)}>GDPR Ready</div>
              </div>
            </div>
          </div>

          {/* Animated Statistics */}
          <div className={cn(commonStyles.stats, themeStyles.stats)}>
            <div className={cn(commonStyles.stat, themeStyles.stat)}>
              <div className={cn(commonStyles.statNumber, themeStyles.statNumber)}>{animatedStats.freelancers.toLocaleString()}+</div>
              <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Active Freelancers</div>
            </div>
            <div className={cn(commonStyles.stat, themeStyles.stat)}>
              <div className={cn(commonStyles.statNumber, themeStyles.statNumber)}>{animatedStats.projects.toLocaleString()}+</div>
              <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Projects Completed</div>
            </div>
            <div className={cn(commonStyles.stat, themeStyles.stat)}>
              <div className={cn(commonStyles.statNumber, themeStyles.statNumber)}>${animatedStats.payments.toLocaleString()}+</div>
              <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Paid to Freelancers</div>
            </div>
            <div className={cn(commonStyles.stat, themeStyles.stat)}>
              <div className={cn(commonStyles.statNumber, themeStyles.statNumber)}>{animatedStats.countries}+</div>
              <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Countries Served</div>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className={commonStyles.background}>
          <div className={cn(commonStyles.gradientOrb, commonStyles.gradientOrbPrimary)}></div>
          <div className={cn(commonStyles.gradientOrb, commonStyles.gradientOrbSecondary)}></div>
          <div className={commonStyles.pattern}></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
