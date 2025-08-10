// @AI-HINT: Enterprise page for MegiLance.
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import common from './Enterprise.common.module.css';
import light from './Enterprise.light.module.css';
import dark from './Enterprise.dark.module.css';

const Enterprise: React.FC = () => {
  const { theme } = useTheme();
  const themed = theme === 'dark' ? dark : light;

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <div className={common.header}>
          <h1 className={common.title}>Enterprise Solutions</h1>
          <p className={cn(common.subtitle, themed.subtitle)}>
            Scale your business with our enterprise-grade freelance platform
          </p>
        </div>

        <section className={common.section}>
          <h2 className={common.sectionTitle}>Enterprise Features</h2>
          <div className={common.featuresGrid}>
            <div className={common.featureCard}>
              <h3 className={common.featureTitle}>Advanced Analytics</h3>
              <p className={common.featureDescription}>
                Comprehensive reporting and analytics to track project performance and team productivity.
              </p>
            </div>
            <div className={common.featureCard}>
              <h3 className={common.featureTitle}>Custom Workflows</h3>
              <p className={common.featureDescription}>
                Tailored approval processes and workflows to match your organization&apos;s needs.
              </p>
            </div>
            <div className={common.featureCard}>
              <h3 className={common.featureTitle}>Dedicated Support</h3>
              <p className={common.featureDescription}>
                24/7 dedicated support team with priority response times for enterprise clients.
              </p>
            </div>
            <div className={common.featureCard}>
              <h3 className={common.featureTitle}>Security & Compliance</h3>
              <p className={common.featureDescription}>
                Enterprise-grade security with SOC 2 compliance and advanced data protection.
              </p>
            </div>
          </div>
        </section>

        <section className={common.section}>
          <h2 className={common.sectionTitle}>Enterprise Plans</h2>
          <div className={common.plansGrid}>
            <div className={common.planCard}>
              <h3 className={common.planTitle}>Business</h3>
              <p className={common.planPrice}>Custom Pricing</p>
              <ul className={common.planFeatures}>
                <li>Up to 100 team members</li>
                <li>Advanced analytics</li>
                <li>Priority support</li>
                <li>Custom integrations</li>
              </ul>
              <Link href="/contact" className={common.planButton}>
                Contact Sales
              </Link>
            </div>
            <div className={common.planCard}>
              <h3 className={common.planTitle}>Enterprise</h3>
              <p className={common.planPrice}>Custom Pricing</p>
              <ul className={common.planFeatures}>
                <li>Unlimited team members</li>
                <li>Full analytics suite</li>
                <li>Dedicated account manager</li>
                <li>Custom development</li>
                <li>SLA guarantees</li>
              </ul>
              <Link href="/contact" className={common.planButton}>
                Contact Sales
              </Link>
            </div>
          </div>
        </section>

        <section className={common.section}>
          <h2 className={common.sectionTitle}>Get Started</h2>
          <p className={common.contactText}>
            Ready to scale your business with MegiLance Enterprise? Our team is here to help.
          </p>
          <Link href="/contact" className={common.contactButton}>
            Schedule a Demo
          </Link>
        </section>
      </div>
    </main>
  );
};

export default Enterprise; 