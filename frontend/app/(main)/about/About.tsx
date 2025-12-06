// @AI-HINT: Premium About page with semantic main landmark, labeled sections, theme-aware styles, and micro-interactions.
'use client';
import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import common from './About.common.module.css';
import light from './About.light.module.css';
import dark from './About.dark.module.css';

const About: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const t = resolvedTheme === 'dark' ? dark : light;
  const styles = {
    root: cn(common.root, t.root),
    hero: cn(common.hero, t.hero),
    title: cn(common.title, t.title),
    subtitle: cn(common.subtitle, t.subtitle),
    grid: cn(common.grid, t.grid),
    card: cn(common.card, t.card),
    cardTitle: cn(common.cardTitle, t.cardTitle),
    cardBody: cn(common.cardBody, t.cardBody),
    sectionHeader: cn(common.sectionHeader, t.sectionHeader),
    sectionTitle: cn(common.sectionTitle, t.sectionTitle),
    sectionNote: cn(common.sectionNote, t.sectionNote),
    valuesGrid: cn(common.valuesGrid, t.valuesGrid),
    valueItem: cn(common.valueItem, t.valueItem),
    valueTitle: cn(common.valueTitle, t.valueTitle),
    valueDesc: cn(common.valueDesc, t.valueDesc),
    timeline: cn(common.timeline, t.timeline),
    milestone: cn(common.milestone, t.milestone),
    milestoneTitle: cn(common.milestoneTitle, t.milestoneTitle),
    cta: cn(common.cta, t.cta),
    ctaBtn: cn(common.ctaBtn, t.ctaBtn),
  };

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
         <AnimatedOrb variant="purple" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
         <AnimatedOrb variant="blue" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
         <ParticlesSystem count={15} className="absolute inset-0" />
         <div className="absolute top-20 left-10 opacity-10 animate-float-slow">
           <FloatingCube size={40} />
         </div>
         <div className="absolute bottom-40 right-20 opacity-10 animate-float-medium">
           <FloatingSphere size={30} variant="gradient" />
         </div>
      </div>

      <main id="main-content" role="main" aria-labelledby="about-title" className={styles.root}>
        <header className={styles.hero}>
          <ScrollReveal direction="down">
            <h1 id="about-title" className={styles.title}>About MegiLance</h1>
            <p className={styles.subtitle}>
              We’re building an investor‑grade, AI‑powered freelancing platform with secure payments, premium UX, and
              world‑class accessibility.
            </p>
          </ScrollReveal>
        </header>

        <section aria-labelledby="mission-title">
          <ScrollReveal>
            <div className={styles.sectionHeader}>
              <h2 id="mission-title" className={styles.sectionTitle}>Our Mission</h2>
              <span aria-hidden="true" className={styles.sectionNote}>Built for scale, designed for trust</span>
            </div>
          </ScrollReveal>
          <StaggerContainer className={styles.grid}>
            <StaggerItem className={styles.card} tabIndex={0} aria-labelledby="mission-ux-title">
              <h3 id="mission-ux-title" className={styles.cardTitle}>Delightful Experience</h3>
              <p className={styles.cardBody}>
                Every interaction is crafted with micro‑interactions, motion, and clarity to reduce friction and boost
                confidence.
              </p>
            </StaggerItem>
            <StaggerItem className={styles.card} tabIndex={0} aria-labelledby="mission-a11y-title">
              <h3 id="mission-a11y-title" className={styles.cardTitle}>Accessible by Design</h3>
              <p className={styles.cardBody}>
                Semantic landmarks, proper ARIA, keyboard navigation, and screen reader support are first‑class features.
              </p>
            </StaggerItem>
            <StaggerItem className={styles.card} tabIndex={0} aria-labelledby="mission-secure-title">
              <h3 id="mission-secure-title" className={styles.cardTitle}>Secure & Reliable</h3>
              <p className={styles.cardBody}>
                Enterprise‑ready architecture and secure payment foundations for clients and freelancers worldwide.
              </p>
            </StaggerItem>
          </StaggerContainer>
        </section>

        <section aria-labelledby="values-title">
          <ScrollReveal>
            <div className={styles.sectionHeader}>
              <h2 id="values-title" className={styles.sectionTitle}>Values</h2>
              <span aria-hidden="true" className={styles.sectionNote}>What guides our decisions</span>
            </div>
          </ScrollReveal>
          <StaggerContainer className={styles.valuesGrid}>
            <StaggerItem className={styles.valueItem} aria-labelledby="value-craft-title">
              <h3 id="value-craft-title" className={styles.valueTitle}>Craft</h3>
              <p className={styles.valueDesc}>Meticulous attention to detail with strong design systems and tokens.</p>
            </StaggerItem>
            <StaggerItem className={styles.valueItem} aria-labelledby="value-integrity-title">
              <h3 id="value-integrity-title" className={styles.valueTitle}>Integrity</h3>
              <p className={styles.valueDesc}>Transparent, fair, and respectful collaboration across all roles.</p>
            </StaggerItem>
            <StaggerItem className={styles.valueItem} aria-labelledby="value-performance-title">
              <h3 id="value-performance-title" className={styles.valueTitle}>Performance</h3>
              <p className={styles.valueDesc}>Fast, resilient, and consistent across devices and themes.</p>
            </StaggerItem>
          </StaggerContainer>
        </section>

        <section aria-labelledby="timeline-title">
          <ScrollReveal>
            <div className={styles.sectionHeader}>
              <h2 id="timeline-title" className={styles.sectionTitle}>Timeline</h2>
              <span aria-hidden="true" className={styles.sectionNote}>Milestones we’re delivering</span>
            </div>
          </ScrollReveal>
          <StaggerContainer className={styles.timeline}>
            <StaggerItem className={styles.milestone} aria-labelledby="ms-alpha-title">
              <h3 id="ms-alpha-title" className={styles.milestoneTitle}>Alpha</h3>
              <p>Core UI kits, accessibility, and theme parity across marketing and portals.</p>
            </StaggerItem>
            <StaggerItem className={styles.milestone} aria-labelledby="ms-beta-title">
              <h3 id="ms-beta-title" className={styles.milestoneTitle}>Beta</h3>
              <p>Complex workflows, collaboration features, and performance hardening.</p>
            </StaggerItem>
            <StaggerItem className={styles.milestone} aria-labelledby="ms-ga-title">
              <h3 id="ms-ga-title" className={styles.milestoneTitle}>General Availability</h3>
              <p>Investor‑grade polish across every surface and marketplace readiness.</p>
            </StaggerItem>
          </StaggerContainer>
        </section>

        <section aria-labelledby="cta-title">
          <ScrollReveal>
            <h2 id="cta-title" className={styles.sectionTitle}>Join the Journey</h2>
            <div className={styles.cta}>
              <button className={styles.ctaBtn} aria-label="Get started with MegiLance">
                Get Started
              </button>
              <span className={styles.sectionNote}>We’ll never spam you.</span>
            </div>
          </ScrollReveal>
        </section>
      </main>
    </PageTransition>
  );
};

export default About;
