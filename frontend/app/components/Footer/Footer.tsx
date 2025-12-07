// @AI-HINT: The primary site footer, providing comprehensive navigation, social links, and copyright information with a premium, theme-aware design.
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Github, Twitter, Linkedin } from 'lucide-react';

import MegiLanceLogo from '@/app/components/MegiLanceLogo/MegiLanceLogo';
import StatusIndicator, { FeatureStatus } from '@/app/components/StatusIndicator/StatusIndicator';

import commonStyles from './Footer.common.module.css';
import lightStyles from './Footer.light.module.css';
import darkStyles from './Footer.dark.module.css';

const footerSections = {
  'Product': [
    { name: 'Features', href: '/#features', status: 'complete' },
    { name: 'Pricing', href: '/pricing', status: 'complete' },
    { name: 'For Clients', href: '/clients', status: 'complete' },
    { name: 'For Freelancers', href: '/freelancers', status: 'complete' },
    { name: 'AI Matching', href: '/ai-matching', status: 'working' },
  ],
  'Company': [
    { name: 'About Us', href: '/about', status: 'complete' },
    { name: 'Blog', href: '/blog', status: 'working' },
    { name: 'Careers', href: '/careers', status: 'incomplete' },
    { name: 'Press', href: '/press', status: 'incomplete' },
  ],
  'Resources': [
    { name: 'Help Center', href: '/support', status: 'working' },
    { name: 'Contact Us', href: '/contact', status: 'complete' },
    { name: 'Community', href: '/community', status: 'incomplete' },
    { name: 'System Status', href: '/status', status: 'working' },
  ],
  'Legal': [
    { name: 'Terms of Service', href: '/terms', status: 'complete' },
    { name: 'Privacy Policy', href: '/privacy', status: 'complete' },
    { name: 'Cookie Policy', href: '/cookies', status: 'complete' },
  ],
};

const socialLinks = [
  { name: 'Twitter', href: '#', icon: Twitter },
  { name: 'GitHub', href: '#', icon: Github },
  { name: 'LinkedIn', href: '#', icon: Linkedin },
];

const Footer = () => {
  const { resolvedTheme } = useTheme();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <footer className={cn(commonStyles.footer, styles.footer)}>
      <div className={cn(commonStyles.container)}>
        <div className={commonStyles.mainContent}>
          <div className={commonStyles.brandColumn}>
            <Link href="/" aria-label="MegiLance Home">
              <MegiLanceLogo />
            </Link>
            <p className={cn(commonStyles.tagline, styles.tagline)}>
              The Future of Freelance, Today.
            </p>
          </div>
          <div className={commonStyles.linksGrid}>
            {Object.entries(footerSections).map(([title, links]) => (
              <div key={title} className={commonStyles.linksColumn}>
                <h3 className={cn(commonStyles.linksTitle, styles.linksTitle)}>{title}</h3>
                <ul className={commonStyles.linksList}>
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className={cn(commonStyles.linkItem, styles.linkItem)}>
                        {link.name}
                        {link.status && (
                          <StatusIndicator 
                            status={link.status as FeatureStatus} 
                            className="ml-2 scale-90 origin-left" 
                          />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className={cn(commonStyles.bottomBar, styles.bottomBar)}>
          <p className={cn(commonStyles.copyright, styles.copyright)}>
            &copy; {new Date().getFullYear()} MegiLance, Inc. All rights reserved.
          </p>
          <div className={commonStyles.socialLinks}>
            {socialLinks.map((link) => (
              <a key={link.name} href={link.href} aria-label={link.name} className={cn(commonStyles.socialLink, styles.socialLink)}>
                <link.icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
