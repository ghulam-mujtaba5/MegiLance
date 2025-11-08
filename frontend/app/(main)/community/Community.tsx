// @AI-HINT: Community page for MegiLance.
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import common from './Community.common.module.css';
import light from './Community.light.module.css';
import dark from './Community.dark.module.css';

const Community: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <div className={common.header}>
          <h1 className={common.title}>Community</h1>
          <p className={cn(common.subtitle, themed.subtitle)}>
            Connect with fellow freelancers and clients
          </p>
        </div>

        <section className={common.section}>
          <h2 className={common.sectionTitle}>Join Our Community</h2>
          <div className={common.communityGrid}>
            <div className={common.communityCard}>
              <h3 className={common.communityTitle}>Forums</h3>
              <p className={common.communityDescription}>
                Discuss projects, share tips, and connect with other professionals.
              </p>
              <Link href="/contact" className={common.communityButton}>
                Join Forums
              </Link>
            </div>
            <div className={common.communityCard}>
              <h3 className={common.communityTitle}>Events</h3>
              <p className={common.communityDescription}>
                Attend virtual and in-person events to network and learn.
              </p>
              <Link href="/contact" className={common.communityButton}>
                View Events
              </Link>
            </div>
            <div className={common.communityCard}>
              <h3 className={common.communityTitle}>Groups</h3>
              <p className={common.communityDescription}>
                Join specialized groups based on your skills and interests.
              </p>
              <Link href="/contact" className={common.communityButton}>
                Browse Groups
              </Link>
            </div>
          </div>
        </section>

        <section className={common.section}>
          <h2 className={common.sectionTitle}>Stay Connected</h2>
          <div className={common.socialGrid}>
            <div className={common.socialCard}>
              <h3 className={common.socialTitle}>Discord</h3>
              <p className={common.socialDescription}>
                Join our Discord server for real-time discussions and networking.
              </p>
              <Link href="/contact" className={common.socialButton}>
                Join Discord
              </Link>
            </div>
            <div className={common.socialCard}>
              <h3 className={common.socialTitle}>LinkedIn</h3>
              <p className={common.socialDescription}>
                Follow us on LinkedIn for professional updates and insights.
              </p>
              <Link href="/contact" className={common.socialButton}>
                Follow Us
              </Link>
            </div>
            <div className={common.socialCard}>
              <h3 className={common.socialTitle}>Twitter</h3>
              <p className={common.socialDescription}>
                Stay updated with the latest news and community highlights.
              </p>
              <Link href="/contact" className={common.socialButton}>
                Follow Us
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Community; 