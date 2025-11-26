// @AI-HINT: Premium Hero component - the billion-dollar first impression. Features animated gradient mesh background, glassmorphism cards, floating 3D elements, and engaging micro-interactions.
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { 
  ArrowRight, 
  PlayCircle, 
  Sparkles, 
  ShieldCheck, 
  Bot, 
  Globe, 
  Star, 
  Users, 
  TrendingUp, 
  Award,
  Zap,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

import Button from '@/app/components/Button/Button';
import StatItem from './StatItem';
import { 
  FloatingCube, 
  FloatingSphere, 
  FloatingRing, 
  ParticlesSystem,
  OrbitingElements 
} from '@/app/components/3D';

import commonStyles from './Hero.common.module.css';
import lightStyles from './Hero.light.module.css';
import darkStyles from './Hero.dark.module.css';

const Hero: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Interactive mouse tracking for premium parallax effect
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    setMousePosition({ x: x * 20, y: y * 20 });
  }, []);

  if (!mounted) {
    return (
      <section className={cn(commonStyles.heroContainer)} aria-label="Hero">
        <div className={commonStyles.contentWrapper}>
          <div className={commonStyles.loadingContainer}>
            <div className={commonStyles.loadingSpinner} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      className={cn(commonStyles.heroContainer, styles.heroContainer)}
      onMouseMove={handleMouseMove}
      aria-label="Hero"
    >
      {/* Premium animated mesh gradient background */}
      <div className={cn(commonStyles.meshBackground, styles.meshBackground)} />
      
      {/* Stunning 3D floating objects */}
      <div className={cn(commonStyles.floating3D, commonStyles.floating3DTopLeft)}>
        <FloatingCube size={50} />
      </div>
      <div className={cn(commonStyles.floating3D, commonStyles.floating3DTopRight)}>
        <FloatingSphere size={70} variant="purple" />
      </div>
      <div className={cn(commonStyles.floating3D, commonStyles.floating3DBottomLeft)}>
        <FloatingRing size={80} thickness={6} />
      </div>
      <div className={cn(commonStyles.floating3D, commonStyles.floating3DBottomRight)}>
        <FloatingSphere size={55} variant="orange" />
      </div>
      <div className={cn(commonStyles.floating3D, commonStyles.floating3DCenterRight)}>
        <FloatingCube size={35} />
      </div>
      <div className={cn(commonStyles.floating3D, commonStyles.floating3DCenterLeft)}>
        <OrbitingElements count={4} size={120} />
      </div>
      
      {/* Background particles */}
      <ParticlesSystem count={10} className={commonStyles.particlesLayer} />
      
      {/* Floating orbs with parallax */}
      <div 
        className={commonStyles.floatingOrbs}
        style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}
      >
        <div className={cn(commonStyles.orb, commonStyles.orb1, styles.orb)} />
        <div className={cn(commonStyles.orb, commonStyles.orb2, styles.orb)} />
        <div className={cn(commonStyles.orb, commonStyles.orb3, styles.orb)} />
      </div>

      {/* Grid pattern overlay */}
      <div className={cn(commonStyles.gridPattern, styles.gridPattern)} />

      <div className={commonStyles.contentWrapper}>
        {/* Announcement badge */}
        <Link 
          href="/blog/ai-matching-2025" 
          className={cn(
            commonStyles.announcementBadge, 
            styles.announcementBadge,
            isVisible && commonStyles.fadeInUp
          )}
          style={{ animationDelay: '0.1s' }}
        >
          <span className={cn(commonStyles.badgeIcon, styles.badgeIcon)}>
            <Sparkles size={14} />
          </span>
          <span className={commonStyles.badgeText}>
            New: AI-powered instant matching is here
          </span>
          <ChevronRight size={16} className={commonStyles.badgeArrow} />
        </Link>

        {/* Main headline with gradient text */}
        <h1 
          className={cn(
            commonStyles.mainHeading, 
            styles.mainHeading,
            isVisible && commonStyles.fadeInUp
          )}
          style={{ animationDelay: '0.2s' }}
        >
          <span className={commonStyles.headingLine}>Where Elite Talent</span>
          <span className={cn(commonStyles.headingGradient, styles.headingGradient)}>
            Meets Innovation
          </span>
        </h1>

        {/* Value proposition */}
        <p 
          className={cn(
            commonStyles.subheading, 
            styles.subheading,
            isVisible && commonStyles.fadeInUp
          )}
          style={{ animationDelay: '0.3s' }}
        >
          MegiLance combines AI-powered talent matching with blockchain-secured payments
          to create the world&apos;s most trusted freelance marketplace. Join 50,000+ professionals 
          building their future.
        </p>

        {/* CTA buttons */}
        <div 
          className={cn(
            commonStyles.ctaGroup,
            isVisible && commonStyles.fadeInUp
          )}
          style={{ animationDelay: '0.4s' }}
        >
          <Link href="/signup" className={commonStyles.ctaLink}>
            <Button 
              variant="primary" 
              size="lg" 
              className={cn(commonStyles.primaryCta, styles.primaryCta)}
            >
              Start Free Today
              <ArrowRight size={18} className={commonStyles.ctaIcon} />
            </Button>
          </Link>
          <Link href="/how-it-works" className={commonStyles.ctaLink}>
            <Button 
              variant="outline" 
              size="lg"
              className={cn(commonStyles.secondaryCta, styles.secondaryCta)}
            >
              <PlayCircle size={18} />
              See How It Works
            </Button>
          </Link>
        </div>

        {/* Social proof row */}
        <div 
          className={cn(
            commonStyles.socialProof,
            isVisible && commonStyles.fadeInUp
          )}
          style={{ animationDelay: '0.5s' }}
        >
          <div className={cn(commonStyles.avatarStack, styles.avatarStack)}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={cn(commonStyles.avatar, styles.avatar)}>
                <span>{String.fromCharCode(64 + i)}</span>
              </div>
            ))}
          </div>
          <div className={commonStyles.proofText}>
            <div className={cn(commonStyles.proofStars, styles.proofStars)}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
              <span className={styles.ratingText}>4.9/5</span>
            </div>
            <span className={cn(commonStyles.proofLabel, styles.proofLabel)}>
              Trusted by 50,000+ professionals
            </span>
          </div>
        </div>

        {/* Feature pills */}
        <div 
          className={cn(
            commonStyles.featurePills,
            isVisible && commonStyles.fadeInUp
          )}
          style={{ animationDelay: '0.6s' }}
        >
          <div className={cn(commonStyles.featurePill, styles.featurePill)}>
            <Bot size={16} />
            <span>AI Smart Matching</span>
          </div>
          <div className={cn(commonStyles.featurePill, styles.featurePill)}>
            <Zap size={16} />
            <span>Instant Payments</span>
          </div>
          <div className={cn(commonStyles.featurePill, styles.featurePill)}>
            <ShieldCheck size={16} />
            <span>Blockchain Escrow</span>
          </div>
          <div className={cn(commonStyles.featurePill, styles.featurePill)}>
            <Globe size={16} />
            <span>45+ Countries</span>
          </div>
        </div>

        {/* Stats grid with glassmorphism */}
        <div 
          className={cn(
            commonStyles.statsContainer,
            isVisible && commonStyles.fadeInUp
          )}
          style={{ animationDelay: '0.7s' }}
        >
          <div className={cn(commonStyles.statsGrid, styles.statsGrid)}>
            <StatItem 
              value={50000} 
              label="Active Freelancers" 
              icon={<Users size={20} />} 
            />
            <StatItem 
              value={125000} 
              label="Projects Completed" 
              icon={<Award size={20} />} 
            />
            <StatItem 
              value={2500000} 
              label="Paid to Freelancers" 
              prefix="$" 
              icon={<TrendingUp size={20} />} 
            />
            <StatItem 
              value={45} 
              label="Countries Served" 
              icon={<Globe size={20} />} 
            />
          </div>
        </div>

        {/* Trust badges */}
        <div 
          className={cn(
            commonStyles.trustBadges,
            isVisible && commonStyles.fadeInUp
          )}
          style={{ animationDelay: '0.8s' }}
        >
          <div className={cn(commonStyles.trustBadge, styles.trustBadge)}>
            <CheckCircle2 size={16} />
            <span>SOC 2 Certified</span>
          </div>
          <div className={cn(commonStyles.trustBadge, styles.trustBadge)}>
            <ShieldCheck size={16} />
            <span>Bank-grade Security</span>
          </div>
          <div className={cn(commonStyles.trustBadge, styles.trustBadge)}>
            <Globe size={16} />
            <span>GDPR Compliant</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;