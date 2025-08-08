// @AI-HINT: Portal Help/Support Center page. Theme-aware, accessible, animated knowledge base with contact CTAs.
'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import common from './Help.common.module.css';
import light from './Help.light.module.css';
import dark from './Help.dark.module.css';

const categories = [
  {
    title: 'Getting Started',
    desc: 'Set up your account, invite your team, and configure your workspace.',
    href: '/faq',
  },
  {
    title: 'Billing & Invoices',
    desc: 'Manage subscriptions, invoices, and payment methods securely.',
    href: '/pricing',
  },
  {
    title: 'Security',
    desc: 'Learn how we keep your data protected and compliant.',
    href: '/security',
  },
];

const popularArticles = [
  'How to invite teammates',
  'Managing roles & permissions',
  'Understanding invoices',
  'Turning on 2FA',
];

const Help: React.FC = () => {
  const { theme } = useTheme();
  const themed = theme === 'dark' ? dark : light;

  const headerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const articlesRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const gridVisible = useIntersectionObserver(gridRef, { threshold: 0.1 });
  const articlesVisible = useIntersectionObserver(articlesRef, { threshold: 0.1 });
  const ctaVisible = useIntersectionObserver(ctaRef, { threshold: 0.1 });

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <div ref={headerRef} className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}>
          <h1 className={common.title}>Help Center</h1>
          <p className={common.subtitle}>Find answers, learn best practices, and contact our support team.</p>
        </div>

        <section aria-label="Help categories">
          <div ref={gridRef} className={cn(common.grid, gridVisible ? common.isVisible : common.isNotVisible)}>
            {categories.map((c) => (
              <Link key={c.title} href={c.href} className={common.card} aria-label={`${c.title} category`}>
                <div className={common.cardTitle}>{c.title}</div>
                <p className={common.cardDesc}>{c.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className={common.section} aria-label="Popular articles">
          <h2 className={common.sectionTitle}>Popular Articles</h2>
          <div ref={articlesRef} className={cn(common.list, articlesVisible ? common.isVisible : common.isNotVisible)}>
            {popularArticles.map((a) => (
              <div key={a} className={common.item}>{a}</div>
            ))}
          </div>
        </section>

        <section className={common.section} aria-label="Contact support">
          <div ref={ctaRef} className={cn(common.cta, ctaVisible ? common.isVisible : common.isNotVisible)}>
            <Link href="/support" className={common.button} aria-label="Go to Support">Go to Support</Link>
            <Link href="/contact" className={cn(common.button, common.buttonSecondary)} aria-label="Contact us">Contact Us</Link>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Help;
