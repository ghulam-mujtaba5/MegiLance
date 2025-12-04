// @AI-HINT: Careers page with accessible main landmark, labeled sections, theme-aware styles, and mock roles.
'use client';
import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import common from './Careers.common.module.css';
import light from './Careers.light.module.css';
import dark from './Careers.dark.module.css';

const roles = [
  { id: 'fe-lead', title: 'Senior Frontend Engineer', location: 'Remote', type: 'Full-time' },
  { id: 'pm', title: 'Product Manager', location: 'Remote', type: 'Full-time' },
  { id: 'ds', title: 'Design Systems Engineer', location: 'Remote', type: 'Contract' },
];

const Careers: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <PageTransition>
      <main id="main-content" role="main" aria-labelledby="careers-title" className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <ScrollReveal>
            <header className={common.header}>
              <span className={common.badge}>Join the team</span>
              <h1 id="careers-title" className={common.title}>Careers at MegiLance</h1>
              <p className={common.subtitle}>Build investor-grade software that empowers clients and freelancers globally.</p>
            </header>
          </ScrollReveal>

          <section aria-labelledby="open-roles-heading" className={common.section}>
            <ScrollReveal>
              <h2 id="open-roles-heading" className={common.sectionTitle}>Open Roles</h2>
            </ScrollReveal>
            <StaggerContainer className={common.roles}>
              {roles.map((r) => (
                <StaggerItem key={r.id} className={common.roleCard} aria-labelledby={`role-${r.id}-title`}>
                  <h3 id={`role-${r.id}-title`} className={common.roleTitle}>{r.title}</h3>
                  <p className={common.roleMeta}><span>{r.location}</span> • <span>{r.type}</span></p>
                  <a className={cn(common.button, common.applyButton)} href={`/apply/${r.id}`} aria-label={`Apply for ${r.title}`}>
                    Apply Now
                  </a>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>

          <section aria-labelledby="values-heading" className={common.section}>
            <ScrollReveal>
              <h2 id="values-heading" className={common.sectionTitle}>Our Values</h2>
              <ul className={common.valuesList}>
                <li>Quality with taste</li>
                <li>Security and trust</li>
                <li>Velocity with care</li>
              </ul>
            </ScrollReveal>
          </section>
        </div>
      </main>
    </PageTransition>
  );
};

export default Careers;
