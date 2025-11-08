// @AI-HINT: Support page with theme-aware styling, animated sections, and accessible structure.
'use client';

import React, { useRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import common from './Support.common.module.css';
import light from './Support.light.module.css';
import dark from './Support.dark.module.css';

const Support: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  const headerRef = useRef<HTMLElement | null>(null);
  const catsRef = useRef<HTMLDivElement | null>(null);
  const contactRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const catsVisible = useIntersectionObserver(catsRef, { threshold: 0.1 });
  const contactVisible = useIntersectionObserver(contactRef, { threshold: 0.1 });

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <header
          ref={headerRef as any}
          className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}
        >
          <h1 className={common.title}>Support Center</h1>
          <p className={common.subtitle}>Find quick answers or get in touch with our team.</p>
        </header>

        <section className={common.sections} aria-label="Support sections">
          <div
            ref={catsRef}
            className={cn(common.grid, catsVisible ? common.isVisible : common.isNotVisible)}
            aria-label="Help categories"
          >
            <article className={common.card} aria-labelledby="cat-acc">
              <h3 id="cat-acc" className={common.cardTitle}>Account & Security</h3>
              <p className={common.cardDesc}>Login issues, 2FA, profile settings, and account safety.</p>
              <ul className={common.list}>
                <li><a className={common.link} href="/faq#account">Reset password</a></li>
                <li><a className={common.link} href="/security">Enable 2FA</a></li>
                <li><a className={common.link} href="/legal/privacy">Privacy settings</a></li>
              </ul>
            </article>

            <article className={common.card} aria-labelledby="cat-bill">
              <h3 id="cat-bill" className={common.cardTitle}>Billing</h3>
              <p className={common.cardDesc}>Subscriptions, invoices, refunds, and payment methods.</p>
              <ul className={common.list}>
                <li><a className={common.link} href="/pricing">Manage plan</a></li>
                <li><a className={common.link} href="/faq#billing">View invoices</a></li>
                <li><a className={common.link} href="/contact">Contact billing</a></li>
              </ul>
            </article>

            <article className={common.card} aria-labelledby="cat-jobs">
              <h3 id="cat-jobs" className={common.cardTitle}>Jobs & Projects</h3>
              <p className={common.cardDesc}>Posting jobs, proposals, milestones, and escrow.</p>
              <ul className={common.list}>
                <li><a className={common.link} href="/jobs">Browse jobs</a></li>
                <li><a className={common.link} href="/faq#jobs">Create a posting</a></li>
                <li><a className={common.link} href="/faq#payments">Use escrow</a></li>
              </ul>
            </article>
          </div>

          <div
            ref={contactRef}
            className={cn(common.grid, contactVisible ? common.isVisible : common.isNotVisible)}
            aria-label="Contact options"
          >
            <article className={common.card} aria-labelledby="contact-email">
              <h3 id="contact-email" className={common.cardTitle}>Email Support</h3>
              <p className={common.cardDesc}>Get help via email. We typically respond within 1 business day.</p>
              <div className={common.cta}>
                <a href="mailto:support@megilance.com" className={common.button} aria-label="Email support">support@megilance.com</a>
              </div>
            </article>

            <article className={common.card} aria-labelledby="contact-faq">
              <h3 id="contact-faq" className={common.cardTitle}>FAQ</h3>
              <p className={common.cardDesc}>Find answers to common questions and best practices.</p>
              <div className={common.cta}>
                <a href="/faq" className={cn(common.button, common.buttonSecondary)} aria-label="Go to FAQ">Go to FAQ</a>
              </div>
            </article>

            <article className={common.card} aria-labelledby="contact-form">
              <h3 id="contact-form" className={common.cardTitle}>Contact Form</h3>
              <p className={common.cardDesc}>Prefer a form? Use our contact page and we will route it to the right team.</p>
              <div className={common.cta}>
                <a href="/contact" className={cn(common.button, common.buttonSecondary)} aria-label="Go to Contact page">Contact Us</a>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Support;
