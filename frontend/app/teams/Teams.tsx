// @AI-HINT: Teams page with theme-aware styling, animated sections, and accessible structure.
'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import common from './Teams.common.module.css';
import light from './Teams.light.module.css';
import dark from './Teams.dark.module.css';

const team = [
  { name: 'Megi Lawson', role: 'Founder & CEO', bio: 'Product-centric leader focused on experience, quality, and velocity.', avatar: '/images/team/ceo.jpg' },
  { name: 'Daniel Park', role: 'CTO', bio: 'Systems thinker shipping secure, scalable platforms.', avatar: '/images/team/cto.jpg' },
  { name: 'Aisha Khan', role: 'Head of Design', bio: 'Designing premium, accessible interfaces with purpose.', avatar: '/images/team/design.jpg' },
  { name: 'Luis Garcia', role: 'Lead Blockchain Engineer', bio: 'Delivering audited, resilient smart contracts.', avatar: '/images/team/blockchain.jpg' },
  { name: 'Sofia Rossi', role: 'Lead Frontend Engineer', bio: 'Building delightful, high-performance UI.', avatar: '/images/team/frontend.jpg' },
  { name: 'Ethan Chen', role: 'Head of Growth', bio: 'Data-driven acquisition and retention strategies.', avatar: '/images/team/growth.jpg' },
];

const values = [
  { title: 'Quality over Everything', desc: 'We sweat the details to deliver investor-grade experiences.' },
  { title: 'Security by Design', desc: 'Privacy, protection, and audits are built-in from day one.' },
  { title: 'Customer Obsession', desc: 'We listen carefully and iterate quickly to solve real problems.' },
];

const Teams: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  const headerRef = useRef<HTMLElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const valuesRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const gridVisible = useIntersectionObserver(gridRef, { threshold: 0.1 });
  const valuesVisible = useIntersectionObserver(valuesRef, { threshold: 0.1 });
  const ctaVisible = useIntersectionObserver(ctaRef, { threshold: 0.1 });

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <header
          ref={headerRef as any}
          className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}
        >
          <h1 className={common.title}>Meet the Team</h1>
          <p className={common.subtitle}>Builders, designers, and operators crafting the future of freelance work.</p>
        </header>

        <section aria-label="Team members">
          <div
            ref={gridRef}
            className={cn(common.grid, gridVisible ? common.isVisible : common.isNotVisible)}
          >
            {team.map((p) => (
              <article key={p.name} className={common.card} aria-labelledby={`name-${p.name}`}>
                <Image
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
          </div>
        </section>

        <section className={common.section} aria-label="Our values">
          <h2 className={common.sectionTitle}>Our Values</h2>
          <div
            ref={valuesRef}
            className={cn(common.values, valuesVisible ? common.isVisible : common.isNotVisible)}
          >
            {values.map((v) => (
              <div key={v.title} className={common.valueCard}>
                <h3 className={common.valueTitle}>{v.title}</h3>
                <p className={common.bio}>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={common.section} aria-label="Careers">
          <div
            ref={ctaRef}
            className={cn(common.cta, ctaVisible ? common.isVisible : common.isNotVisible)}
          >
            <a href="/jobs" className={common.button} aria-label="Browse open roles">We are hiring — View roles</a>
            <a href="/contact" className={cn(common.button, common.buttonSecondary)} aria-label="Contact us about careers">Contact Careers</a>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Teams;
