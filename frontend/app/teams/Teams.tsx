// @AI-HINT: Teams page with theme-aware styling, animated sections, and accessible structure.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/components/Animations';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import common from './Teams.common.module.css';
import light from './Teams.light.module.css';
import dark from './Teams.dark.module.css';

const team = [
  { name: 'Megi Lawson', role: 'Founder & CEO', bio: 'Product-centric leader focused on experience, quality, and velocity.', avatar: 'https://ui-avatars.com/api/?name=Megi+Lawson&background=4573df&color=fff&size=128' },
  { name: 'Daniel Park', role: 'CTO', bio: 'Systems thinker shipping secure, scalable platforms.', avatar: 'https://ui-avatars.com/api/?name=Daniel+Park&background=6366f1&color=fff&size=128' },
  { name: 'Aisha Khan', role: 'Head of Design', bio: 'Designing premium, accessible interfaces with purpose.', avatar: 'https://ui-avatars.com/api/?name=Aisha+Khan&background=10b981&color=fff&size=128' },
  { name: 'Luis Garcia', role: 'Lead Blockchain Engineer', bio: 'Delivering audited, resilient smart contracts.', avatar: 'https://ui-avatars.com/api/?name=Luis+Garcia&background=f59e0b&color=fff&size=128' },
  { name: 'Sofia Rossi', role: 'Lead Frontend Engineer', bio: 'Building delightful, high-performance UI.', avatar: 'https://ui-avatars.com/api/?name=Sofia+Rossi&background=ec4899&color=fff&size=128' },
  { name: 'Ethan Chen', role: 'Head of Growth', bio: 'Data-driven acquisition and retention strategies.', avatar: 'https://ui-avatars.com/api/?name=Ethan+Chen&background=8b5cf6&color=fff&size=128' },
];

const values = [
  { title: 'Quality over Everything', desc: 'We sweat the details to deliver production-ready experiences.' },
  { title: 'Security by Design', desc: 'Privacy, protection, and audits are built-in from day one.' },
  { title: 'Customer Obsession', desc: 'We listen carefully and iterate quickly to solve real problems.' },
];

const Teams: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <AnimatedOrb variant="purple" size={480} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
        <AnimatedOrb variant="blue" size={380} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
        <ParticlesSystem count={12} className="absolute inset-0" />
        <div className="absolute top-28 left-12 opacity-10">
          <FloatingCube size={55} />
        </div>
        <div className="absolute bottom-36 right-16 opacity-10">
          <FloatingSphere size={45} />
        </div>
      </div>
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <ScrollReveal>
            <header className={common.header}>
              <h1 className={common.title}>Meet the Team</h1>
              <p className={common.subtitle}>Builders, designers, and operators crafting the future of freelance work.</p>
            </header>
          </ScrollReveal>

          <section aria-label="Team members">
            <StaggerContainer className={common.grid} delay={0.1}>
              {team.map((p) => (
                <article key={p.name} className={common.card} aria-labelledby={`name-${p.name}`}>
                  <img
                    className={common.avatar}
                    src={p.avatar}
                    alt={`${p.name} avatar`}
                    width={64}
                    height={64}
                    loading="lazy"
                  />
                  <div className={common.person}>
                    <h3 id={`name-${p.name}`} className={common.name}>{p.name}</h3>
                    <span className={common.role}>{p.role}</span>
                    <p className={common.bio}>{p.bio}</p>
                  </div>
                </article>
              ))}
            </StaggerContainer>
          </section>

          <section className={common.section} aria-label="Our values">
            <h2 className={common.sectionTitle}>Our Values</h2>
            <StaggerContainer className={common.values} delay={0.2}>
              {values.map((v) => (
                <div key={v.title} className={common.valueCard}>
                  <h3 className={common.valueTitle}>{v.title}</h3>
                  <p className={common.bio}>{v.desc}</p>
                </div>
              ))}
            </StaggerContainer>
          </section>

          <section className={common.section} aria-label="Careers">
            <ScrollReveal className={common.cta} delay={0.3}>
              <a href="/jobs" className={common.button} aria-label="Browse open roles">We are hiring — View roles</a>
              <a href="/contact" className={cn(common.button, common.buttonSecondary)} aria-label="Contact us about careers">Contact Careers</a>
            </ScrollReveal>

          </section>
        </div>
      </main>
    </PageTransition>
  );
};

export default Teams;
