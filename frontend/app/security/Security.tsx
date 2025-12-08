// @AI-HINT: Security page using per-page theme-aware modules, intersection observer animations, and accessible structure.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/components/Animations';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import common from './Security.common.module.css';
import light from './Security.light.module.css';
import dark from './Security.dark.module.css';

const Security: React.FC = () => {
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

      <main id="main-content" role="main" className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <ScrollReveal>
            <header className={common.header}>
              <h1 className={common.title}>Security Overview</h1>
              <p className={common.subtitle} aria-label="Last updated">Last Updated: August 4, 2025</p>
            </header>
          </ScrollReveal>

          <StaggerContainer className={common.grid} aria-label="Security highlights" delay={0.1}>
            <article className={common.card} aria-labelledby="sec-1">
              <h3 id="sec-1" className={common.cardTitle}>Smart Contract Security</h3>
              <p className={common.cardDesc}>
                Our payment and escrow systems are built on audited smart contracts. All contracts undergo rigorous
                internal testing and multiple external audits from leading security firms before deployment. Audit reports
                are available upon request.
              </p>
            </article>

            <article className={common.card} aria-labelledby="sec-2">
              <h3 id="sec-2" className={common.cardTitle}>Platform Security</h3>
              <p className={common.cardDesc}>
                We employ industry-standard security practices to protect our platform, including encryption of data in
                transit and at rest, regular security scans, and protection against common web vulnerabilities like XSS
                and CSRF.
              </p>
            </article>

            <article className={common.card} aria-labelledby="sec-3">
              <h3 id="sec-3" className={common.cardTitle}>Account Protection</h3>
              <p className={common.cardDesc}>
                User accounts are protected with password hashing. We strongly recommend all users enable two-factor
                authentication (2FA) for an additional layer of security. You are responsible for the security of your own
                account credentials and connected wallets.
              </p>
            </article>
          </StaggerContainer>

          <ScrollReveal className={common.section} delay={0.2}>
            <h2 className={common.sectionTitle}>Responsible Disclosure</h2>
            <p className={common.cardDesc}>
              If you discover a security vulnerability, please report it to us at security@megilance.com. We appreciate
              the community&apos;s help in keeping our platform safe and may offer bounties for valid, responsibly disclosed
              vulnerabilities.
            </p>
            <div className={common.cta}>
              <a 
                href="mailto:security@megilance.com" 
                className={common.button} 
                aria-label="Email security team"
              >
                Contact Security
              </a>
              <a 
                href="/docs/security-policy.pdf" 
                className={cn(common.button, common.buttonSecondary)} 
                aria-label="View security policy"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Policy
              </a>
            </div>
          </ScrollReveal>
        </div>
      </main>
    </PageTransition>
  );
};

export default Security;
