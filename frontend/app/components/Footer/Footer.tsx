// @AI-HINT: The primary site footer, providing comprehensive navigation, social links, and copyright information with a premium, theme-aware design.
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Github, Twitter, Linkedin } from 'lucide-react';

import MegiLanceLogo from '@/app/components/MegiLanceLogo/MegiLanceLogo';

import commonStyles from './Footer.common.module.css';
import lightStyles from './Footer.light.module.css';
import darkStyles from './Footer.dark.module.css';

const footerSections = {
  'Platform': [
    { name: 'Marketplace', href: '/#features' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Talent Directory', href: '/talent' },
    { name: 'AI Matching', href: '/explore' },
  ],
  'For You': [
    { name: 'For Clients', href: '/clients' },
    { name: 'For Freelancers', href: '/freelancers' },
    { name: 'Teams', href: '/teams' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Careers', href: '/careers' },
  ],
  'Resources': [
    { name: 'Help Center', href: '/support' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'About Us', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Community', href: '/community' },
  ],
  'Legal': [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'System Status', href: '/status' },
  ],
};

const socialLinks = [
  { name: 'Twitter', href: 'https://twitter.com/megilance', icon: Twitter },
  { name: 'GitHub', href: 'https://github.com/megilance', icon: Github },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/company/megilance', icon: Linkedin },
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
                        <span className={commonStyles.linkText}>{link.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className={cn(commonStyles.bottomBar, styles.bottomBar)}>
          <div className={commonStyles.copyrightWrapper}>
            <p className={cn(commonStyles.copyright, styles.copyright)}>
              &copy; {new Date().getFullYear()} MegiLance. All rights reserved.
            </p>
            <p className={cn(commonStyles.university, styles.university)}>
              Built with AI-powered technology
            </p>
          </div>
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
