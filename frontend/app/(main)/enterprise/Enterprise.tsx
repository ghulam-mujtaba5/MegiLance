// @AI-HINT: Enterprise page for MegiLance.
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import common from './Enterprise.common.module.css';
import light from './Enterprise.light.module.css';
import dark from './Enterprise.dark.module.css';

const Enterprise: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
         <AnimatedOrb variant="purple" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
         <AnimatedOrb variant="blue" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
         <ParticlesSystem count={12} className="absolute inset-0" />
         <div className="absolute top-20 left-10 opacity-10 animate-float-slow">
           <FloatingCube size={40} />
         </div>
         <div className="absolute bottom-40 right-20 opacity-10 animate-float-medium">
           <FloatingSphere size={30} variant="gradient" />
         </div>
      </div>

      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <ScrollReveal>
            <div className={common.header}>
              <h1 className={common.title}>Enterprise Solutions</h1>
              <p className={cn(common.subtitle, themed.subtitle)}>
                Scale your business with our enterprise-grade freelance platform
              </p>
            </div>
          </ScrollReveal>

          <section className={common.section}>
            <ScrollReveal>
              <h2 className={common.sectionTitle}>Enterprise Features</h2>
            </ScrollReveal>
            <StaggerContainer className={common.featuresGrid}>
              <StaggerItem className={common.featureCard}>
                <h3 className={common.featureTitle}>Advanced Analytics</h3>
                <p className={common.featureDescription}>
                  Comprehensive reporting and analytics to track project performance and team productivity.
                </p>
              </StaggerItem>
              <StaggerItem className={common.featureCard}>
                <h3 className={common.featureTitle}>Custom Workflows</h3>
                <p className={common.featureDescription}>
                  Tailored approval processes and workflows to match your organization&apos;s needs.
                </p>
              </StaggerItem>
              <StaggerItem className={common.featureCard}>
                <h3 className={common.featureTitle}>Dedicated Support</h3>
                <p className={common.featureDescription}>
                  24/7 dedicated support team with priority response times for enterprise clients.
                </p>
              </StaggerItem>
              <StaggerItem className={common.featureCard}>
                <h3 className={common.featureTitle}>Security & Compliance</h3>
                <p className={common.featureDescription}>
                  Enterprise-grade security with SOC 2 compliance and advanced data protection.
                </p>
              </StaggerItem>
            </StaggerContainer>
          </section>

          <section className={common.section}>
            <ScrollReveal>
              <h2 className={common.sectionTitle}>Enterprise Plans</h2>
            </ScrollReveal>
            <StaggerContainer className={common.plansGrid}>
              <StaggerItem className={common.planCard}>
                <h3 className={common.planTitle}>Business</h3>
                <p className={common.planPrice}>Custom Pricing</p>
                <ul className={common.planFeatures}>
                  <li>Up to 100 team members</li>
                  <li>Advanced analytics</li>
                  <li>Priority support</li>
                  <li>Custom integrations</li>
                </ul>
                <Link href="/contact" className={common.planButton}>
                  Contact Sales
                </Link>
              </StaggerItem>
              <StaggerItem className={common.planCard}>
                <h3 className={common.planTitle}>Enterprise</h3>
                <p className={common.planPrice}>Custom Pricing</p>
                <ul className={common.planFeatures}>
                  <li>Unlimited team members</li>
                  <li>Full analytics suite</li>
                  <li>Dedicated account manager</li>
                  <li>Custom development</li>
                  <li>SLA guarantees</li>
                </ul>
                <Link href="/contact" className={common.planButton}>
                  Contact Sales
                </Link>
              </StaggerItem>
            </StaggerContainer>
          </section>

          <section className={common.section}>
            <ScrollReveal>
              <h2 className={common.sectionTitle}>Get Started</h2>
              <p className={common.contactText}>
                Ready to scale your business with MegiLance Enterprise? Our team is here to help.
              </p>
              <Link href="/contact" className={common.contactButton}>
                Schedule a Demo
              </Link>
            </ScrollReveal>
          </section>
        </div>
      </main>
    </PageTransition>
  );
};

export default Enterprise; 