// @AI-HINT: Testimonials page with theme-aware styling, animated sections, and accessible structure.
'use client';

import React, { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import { Button } from '@/app/components/Button/Button';
import common from './Testimonials.common.module.css';
import light from './Testimonials.light.module.css';
import dark from './Testimonials.dark.module.css';

const ALL = 'All';
const categories = [ALL, 'Clients', 'Freelancers', 'Enterprise'];

const testimonials = [
  {
    name: 'Nora Patel',
    role: 'Head of Product, AtlasAI',
    category: 'Enterprise',
    quote:
      'MegiLance delivered investor-grade velocity with uncompromising quality. Our AI rollout landed ahead of schedule.',
    avatar: '/images/testimonials/nora.jpg',
  },
  {
    name: 'Samir Rahman',
    role: 'Senior iOS Engineer',
    category: 'Freelancers',
    quote:
      'The platform finally treats freelancers as first-class partners. Transparent escrow and fast payouts changed my workflow.',
    avatar: '/images/testimonials/samir.jpg',
  },
  {
    name: 'Emily Stone',
    role: 'Founder, Crisp Labs',
    category: 'Clients',
    quote:
      'We shipped a polished MVP in weeks. The talent quality and tooling are on par with the best in the industry.',
    avatar: '/images/testimonials/emily.jpg',
  },
  {
    name: 'Diego Morales',
    role: 'Blockchain Architect',
    category: 'Freelancers',
    quote:
      'Audited contracts and clear milestones gave me confidence to focus on building. The experience feels premium end-to-end.',
    avatar: '/images/testimonials/diego.jpg',
  },
  {
    name: 'Hannah Lee',
    role: 'VP Engineering, NovaCloud',
    category: 'Enterprise',
    quote:
      'Security reviews and compliance were top-notch. MegiLance matched our bar on reliability and controls.',
    avatar: '/images/testimonials/hannah.jpg',
  },
  {
    name: 'Ava Johnson',
    role: 'Founder, PixelMint',
    category: 'Clients',
    quote:
      'Immaculate UI quality. The teams shipped with taste and precision you rarely see.',
    avatar: '/images/testimonials/ava.jpg',
  },
];

const Testimonials: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  const [selected, setSelected] = useState<string>(ALL);
  const filtered = useMemo(
    () => (selected === ALL ? testimonials : testimonials.filter((t) => t.category === selected)),
    [selected]
  );

  const headerRef = useRef<HTMLElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  const controlsVisible = useIntersectionObserver(controlsRef, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  const gridVisible = useIntersectionObserver(gridRef, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });
  const ctaVisible = useIntersectionObserver(ctaRef, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });

  return (
    <main id="main-content" role="main" aria-labelledby="testimonials-title" className={cn(common.page, themed.page)}>
      <div className={common.container}>
        <header
          ref={headerRef}
          className={cn(common.header, themed.header, headerVisible ? common.isVisible : common.isNotVisible)}
        >
          <h1 id="testimonials-title" className={cn(common.title, themed.title)}>What Our Users Say</h1>
          <p className={cn(common.subtitle, themed.subtitle)}>Real stories from clients, freelancers, and enterprise partners.</p>
        </header>

        <div
          ref={controlsRef}
          className={cn(common.controls, controlsVisible ? common.isVisible : common.isNotVisible)}
          role="toolbar"
          aria-label="Filter testimonials by category"
        >
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={cn(common.chip, themed.chip)}
              aria-pressed={selected === c || undefined}
              onClick={() => setSelected(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <section aria-label="Testimonials">
          <div
            ref={gridRef}
            className={cn(common.grid, gridVisible ? common.isVisible : common.isNotVisible)}
          >
            {filtered.map((t, index) => (
              <figure key={t.name} className={cn(common.card, themed.card)} style={{ transitionDelay: `${index * 100}ms` }}>
                <div className={common.quoteWrapper}>
                  <Quote className={cn(common.quoteIcon, themed.quoteIcon)} aria-hidden="true" />
                  <blockquote className={cn(common.quote, themed.quote)}>“{t.quote}”</blockquote>
                </div>
                <figcaption className={cn(common.person, themed.person)}>
                  <Image
                    className={common.avatar}
                    src={t.avatar}
                    alt={`${t.name} avatar`}
                    width={48}
                    height={48}
                    loading="lazy"
                  />
                  <div className={common.personDetails}>
                    <div className={cn(common.name, themed.name)}>{t.name}</div>
                    <div className={cn(common.role, themed.role)}>{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section ref={ctaRef} className={cn(common.ctaSection, ctaVisible ? common.isVisible : common.isNotVisible)} aria-label="Call to action">
          <div className={cn(common.cta, themed.cta)}>
            <h2 className={cn(common.ctaTitle, themed.ctaTitle)}>Ready to build your masterpiece?</h2>
            <div className={common.buttonGroup}>
              <Link href="/signup/client" passHref legacyBehavior>
                <Button as="a" size="lg" variant="primary">Join as a Client</Button>
              </Link>
              <Link href="/signup/freelancer" passHref legacyBehavior>
                <Button as="a" size="lg" variant="secondary">Apply as Talent</Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Testimonials;
