// @AI-HINT: Press page with accessible main landmark, labeled sections, and theme-aware styles.
'use client';
import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import common from './Press.common.module.css';
import light from './Press.light.module.css';
import dark from './Press.dark.module.css';

const Press: React.FC = () => {
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

      <main id="main-content" role="main" aria-labelledby="press-title" className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <ScrollReveal>
            <header className={common.header}>
              <span className={common.badge}>Press & Media</span>
              <h1 id="press-title" className={common.title}>MegiLance Press</h1>
              <p className={common.subtitle}>Resources for journalists and partners. Brand assets, boilerplate, and contacts.</p>
            </header>
          </ScrollReveal>

          <section aria-labelledby="press-kit-heading" className={common.section}>
            <ScrollReveal>
              <h2 id="press-kit-heading" className={common.sectionTitle}>Press Kit</h2>
            </ScrollReveal>
            <StaggerContainer className={common.grid}>
              <StaggerItem className={common.card}>
                <h3 className={common.cardTitle}>Logos & Assets</h3>
                <p>Download high‑res logos, app icons, and screenshots.</p>
                <a className={cn(common.button, common.primary)} href="/assets/press/megilance-press-kit.zip" aria-label="Download MegiLance press kit">
                  Download Press Kit
                </a>
              </StaggerItem>
              <StaggerItem className={common.card}>
                <h3 className={common.cardTitle}>Company Boilerplate</h3>
                <p>MegiLance is an AI-powered freelance marketplace with secure USDC escrow and investor‑grade UX.</p>
                <button type="button" className={cn(common.button, common.secondary)} onClick={() => navigator.clipboard?.writeText('MegiLance is an AI-powered freelance marketplace with secure USDC escrow and investor‑grade UX.')}
                  aria-label="Copy company boilerplate to clipboard">
                  Copy Text
                </button>
              </StaggerItem>
            </StaggerContainer>
          </section>

          <section aria-labelledby="media-contact-heading" className={common.section}>
            <ScrollReveal>
              <h2 id="media-contact-heading" className={common.sectionTitle}>Media Inquiries</h2>
              <p>Reach our communications team at <a className={common.link} href="mailto:press@megilance.com">press@megilance.com</a>.</p>
            </ScrollReveal>
          </section>
        </div>
      </main>
    </PageTransition>
  );
};

export default Press;
