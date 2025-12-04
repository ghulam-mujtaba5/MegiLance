// @AI-HINT: Clients page with theme-aware styling, animated sections, accessible structure, and optimized images.
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
// Lazy load cards to keep initial bundle lean
const ClientLogoCard = dynamic(() => import('./components/ClientLogoCard'));
const CaseStudyCard = dynamic(() => import('./components/CaseStudyCard'));
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { useToaster } from '@/app/components/Toast/ToasterProvider';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/components/Animations';
import common from './Clients.common.module.css';
import light from './Clients.light.module.css';
import dark from './Clients.dark.module.css';

const ALL = 'All';
const industries = [ALL, 'AI', 'Fintech', 'E-commerce', 'Healthcare'];

// Using placeholder assets until real logos are added (replace src with real optimized WebP/SVG)
const logos = [
  { name: 'AtlasAI', industry: 'AI', src: '/images/clients/placeholder.svg' },
  { name: 'NovaBank', industry: 'Fintech', src: '/images/clients/placeholder.svg' },
  { name: 'PixelMint', industry: 'E-commerce', src: '/images/clients/placeholder.svg' },
  { name: 'CureWell', industry: 'Healthcare', src: '/images/clients/placeholder.svg' },
  { name: 'CortexCloud', industry: 'AI', src: '/images/clients/placeholder.svg' },
  { name: 'VoltPay', industry: 'Fintech', src: '/images/clients/placeholder.svg' },
  { name: 'ShopSphere', industry: 'E-commerce', src: '/images/clients/placeholder.svg' },
  { name: 'Medisphere', industry: 'Healthcare', src: '/images/clients/placeholder.svg' },
];

const cases = [
  {
    title: 'AI-assisted onboarding reduced time-to-value by 42%',
    desc: 'Enterprise-grade workflows and fine-tuned models improved user activation and retention.',
    media: '/images/cases/placeholder.jpg',
  },
  {
    title: 'Payments reliability at 99.99% with audited contracts',
    desc: 'Escrow releases, milestone tracking, and dispute resolution led to higher trust and volume.',
    media: '/images/cases/placeholder.jpg',
  },
  {
    title: 'Design system refresh accelerated shipping by 3x',
    desc: 'A premium, accessible component library unified teams and improved build velocity.',
    media: '/images/cases/placeholder.jpg',
  },
];

interface Metric {
  label: string;
  value: string;
  detail: string;
}

const metrics: Metric[] = [
  { label: 'Avg. Activation Lift', value: '+42%', detail: 'AI-guided onboarding flows' },
  { label: 'Payment Reliability', value: '99.99%', detail: 'Audited escrow contracts' },
  { label: 'Shipping Velocity', value: '3×', detail: 'Unified component system' },
  { label: 'Talent Match Accuracy', value: '92%', detail: 'ML-powered ranking' },
];

const Clients: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { notify } = useToaster();

  const [selected, setSelected] = useState<string>(ALL);
  const [isLoading, setIsLoading] = useState(true);
  // Simulate loading for skeleton UX (replace with real data fetch later)
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);
  const filtered = useMemo(
    () => (selected === ALL ? logos : logos.filter((l) => l.industry === selected)),
    [selected]
  );

  const onSelect = useCallback((c: string) => {
    setSelected(c);
    notify({
      title: 'Filter applied',
      description: c === ALL ? 'Showing all industries' : `Showing ${c} clients`,
      variant: 'info',
      duration: 1800,
    });
  }, [notify]);

  return (
    <PageTransition>
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <ScrollReveal>
            <header className={common.header}>
              <h1 className={common.title}>Our Clients</h1>
              <p className={common.subtitle}>Trusted by high-velocity teams across AI, fintech, e‑commerce, and healthcare.</p>
            </header>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div
              className={common.controls}
              role="toolbar"
              aria-label="Filter clients by industry"
            >
              {industries.map((c) => {
                const active = selected === c;
                return (
                  <button
                    key={c}
                    type="button"
                    className={cn(common.chip, active && common.chipActive)}
                    aria-pressed={active ? 'true' : 'false'}
                    data-active={active || undefined}
                    onClick={() => onSelect(c)}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </ScrollReveal>

          <section aria-label="Client logos">
            <StaggerContainer className={common.grid} delay={0.2}>
              {isLoading && (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={`s-${i}`} className={cn(common.logoCard, common.skeleton)} aria-hidden="true" />
                ))
              )}
              {!isLoading && filtered.length === 0 && (
                <div className={common.gridSpanAll}>
                  <EmptyState
                    title="No clients in this category"
                    description="Try a different industry or contact our team for a tailored walkthrough."
                    action={
                      <a href="/contact" className={common.button} aria-label="Contact sales">
                        Contact Sales
                      </a>
                    }
                  />
                </div>
              )}
              {!isLoading && filtered.length > 0 && (
                filtered.map((l) => (
                  <ClientLogoCard key={l.name} name={l.name} src={l.src} industry={l.industry} />
                ))
              )}
            </StaggerContainer>
          </section>

          <section className={common.section} aria-label="Impact metrics">
            <h2 className={common.sectionTitle}>Impact Metrics</h2>
            <StaggerContainer className={common.metricGrid} role="list" delay={0.3}>
              {metrics.map(m => (
                <li key={m.label} className={common.metricCard}>
                  <div className={common.metricValue}>{m.value}</div>
                  <div className={common.metricLabel}>{m.label}</div>
                  <div className={common.metricDetail}>{m.detail}</div>
                </li>
              ))}
            </StaggerContainer>
          </section>

          <section className={common.section} aria-label="Case studies">
            <h2 className={common.sectionTitle}>Case Studies</h2>
            <StaggerContainer className={common.caseGrid} delay={0.4}>
              {cases.map((c) => (
                <CaseStudyCard key={c.title} title={c.title} description={c.desc} media={c.media} />
              ))}
            </StaggerContainer>
          </section>

          <section className={common.section} aria-label="Call to action">
            <ScrollReveal className={common.cta} delay={0.5}>
              <a
                href="/contact"
                className={common.button}
                aria-label="Contact sales"
                onClick={() =>
                  notify({ title: 'Opening contact', description: 'We’ll help you get started.', variant: 'success', duration: 2500 })
                }
              >
                Contact Sales
              </a>
              <a
                href="/jobs"
                className={cn(common.button, common.buttonSecondary)}
                aria-label="Find talent"
                onClick={() =>
                  notify({ title: 'Explore talent', description: 'Curated experts across domains.', variant: 'info', duration: 2500 })
                }
              >
                Find Talent
              </a>
            </ScrollReveal>
          </section>
        </div>
      </main>
    </PageTransition>
  );
};

export default Clients;
