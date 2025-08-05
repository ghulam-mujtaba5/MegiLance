// @AI-HINT: Enhanced Hero section with animated statistics and multiple CTAs for maximum impact

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/app/components/Button/Button';
import { FaRocket, FaPlay, FaShieldAlt, FaRobot, FaBitcoin, FaGlobe } from 'react-icons/fa';
import './Hero.common.css';
import './Hero.light.css';
import './Hero.dark.css';

interface HeroProps {
  theme?: "light" | "dark";
}

const Hero: React.FC<HeroProps> = ({ theme = "light" }) => {
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
    <section className="Hero">
      <div className="Hero-container">
        <div className="Hero-content">
          {/* Main Hero Content */}
          <div className="Hero-main">
            <div className="Hero-badge">
              <FaRobot className="Hero-badge-icon" />
              <span>AI-Powered • Blockchain-Secured • Pakistan's #1 Platform</span>
            </div>
            
            <h1 className="Hero-title">
              The Future of <span className="Hero-title-highlight">Freelancing</span> is Here
            </h1>
            
            <p className="Hero-subtitle">
              MegiLance revolutionizes freelance work with AI-powered job matching, 
              instant USDC payments, and blockchain-secured escrow. Built for Pakistani 
              talent, designed for global success.
            </p>

            <div className="Hero-features-grid">
              <div className="Hero-feature">
                <FaRobot className="Hero-feature-icon" />
                <span>AI Smart Matching</span>
              </div>
              <div className="Hero-feature">
                <FaBitcoin className="Hero-feature-icon" />
                <span>Instant USDC Payments</span>
              </div>
              <div className="Hero-feature">
                <FaShieldAlt className="Hero-feature-icon" />
                <span>Blockchain Escrow</span>
              </div>
              <div className="Hero-feature">
                <FaGlobe className="Hero-feature-icon" />
                <span>Global Opportunities</span>
              </div>
            </div>

            <div className="Hero-cta">
              <Link href="/Signup" className="Hero-cta-link">
                <Button theme={theme} variant="primary" size="large">
                  <FaRocket /> Start Earning Today
                </Button>
              </Link>
              <Link href="/demo" className="Hero-cta-link">
                <Button theme={theme} variant="secondary" size="large">
                  <FaPlay /> Watch Demo
                </Button>
              </Link>
            </div>

            <div className="Hero-trust-indicators">
              <span className="Hero-trust-text">Trusted by freelancers worldwide</span>
              <div className="Hero-trust-badges">
                <div className="Hero-trust-badge">256-bit SSL</div>
                <div className="Hero-trust-badge">SOC 2 Compliant</div>
                <div className="Hero-trust-badge">GDPR Ready</div>
              </div>
            </div>
          </div>

          {/* Animated Statistics */}
          <div className="Hero-stats">
            <div className="Hero-stat">
              <div className="Hero-stat-number">{animatedStats.freelancers.toLocaleString()}+</div>
              <div className="Hero-stat-label">Active Freelancers</div>
            </div>
            <div className="Hero-stat">
              <div className="Hero-stat-number">{animatedStats.projects.toLocaleString()}+</div>
              <div className="Hero-stat-label">Projects Completed</div>
            </div>
            <div className="Hero-stat">
              <div className="Hero-stat-number">${animatedStats.payments.toLocaleString()}+</div>
              <div className="Hero-stat-label">Paid to Freelancers</div>
            </div>
            <div className="Hero-stat">
              <div className="Hero-stat-number">{animatedStats.countries}+</div>
              <div className="Hero-stat-label">Countries Served</div>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="Hero-background">
          <div className="Hero-gradient-orb Hero-gradient-orb--primary"></div>
          <div className="Hero-gradient-orb Hero-gradient-orb--secondary"></div>
          <div className="Hero-pattern"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
