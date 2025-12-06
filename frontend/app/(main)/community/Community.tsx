// @AI-HINT: Community page for MegiLance.
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import common from './Community.common.module.css';
import light from './Community.light.module.css';
import dark from './Community.dark.module.css';

const Community: React.FC = () => {
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
              <h1 className={common.title}>Community</h1>
              <p className={cn(common.subtitle, themed.subtitle)}>
                Connect with fellow freelancers and clients
              </p>
            </div>
          </ScrollReveal>

          <section className={common.section}>
            <ScrollReveal>
              <h2 className={common.sectionTitle}>Join Our Community</h2>
            </ScrollReveal>
            <StaggerContainer className={common.communityGrid}>
              <StaggerItem className={common.communityCard}>
                <h3 className={common.communityTitle}>Forums</h3>
                <p className={common.communityDescription}>
                  Discuss projects, share tips, and connect with other professionals.
                </p>
                <Link href="/contact" className={common.communityButton}>
                  Join Forums
                </Link>
              </StaggerItem>
              <StaggerItem className={common.communityCard}>
                <h3 className={common.communityTitle}>Events</h3>
                <p className={common.communityDescription}>
                  Attend virtual and in-person events to network and learn.
                </p>
                <Link href="/contact" className={common.communityButton}>
                  View Events
                </Link>
              </StaggerItem>
              <StaggerItem className={common.communityCard}>
                <h3 className={common.communityTitle}>Groups</h3>
                <p className={common.communityDescription}>
                  Join specialized groups based on your skills and interests.
                </p>
                <Link href="/contact" className={common.communityButton}>
                  Browse Groups
                </Link>
              </StaggerItem>
            </StaggerContainer>
          </section>

          <section className={common.section}>
            <ScrollReveal>
              <h2 className={common.sectionTitle}>Stay Connected</h2>
            </ScrollReveal>
            <StaggerContainer className={common.socialGrid}>
              <StaggerItem className={common.socialCard}>
                <h3 className={common.socialTitle}>Discord</h3>
                <p className={common.socialDescription}>
                  Join our Discord server for real-time discussions and networking.
                </p>
                <Link href="/contact" className={common.socialButton}>
                  Join Discord
                </Link>
              </StaggerItem>
              <StaggerItem className={common.socialCard}>
                <h3 className={common.socialTitle}>LinkedIn</h3>
                <p className={common.socialDescription}>
                  Follow us on LinkedIn for professional updates and insights.
                </p>
                <Link href="/contact" className={common.socialButton}>
                  Follow Us
                </Link>
              </StaggerItem>
              <StaggerItem className={common.socialCard}>
                <h3 className={common.socialTitle}>Twitter</h3>
                <p className={common.socialDescription}>
                  Stay updated with the latest news and community highlights.
                </p>
                <Link href="/contact" className={common.socialButton}>
                  Follow Us
                </Link>
              </StaggerItem>
            </StaggerContainer>
          </section>
        </div>
      </main>
    </PageTransition>
  );
};

export default Community; 