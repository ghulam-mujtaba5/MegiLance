// @AI-HINT: Footer component with comprehensive navigation links, social media, and company information. Uses per-component theming and accessibility best practices.

'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/app/contexts/ThemeContext';
import { footerNavItems } from '@/app/config/navigation';
import { MegiLanceLogo } from '../Public/MegiLanceLogo';
import { 
  FaTwitter, 
  FaLinkedin, 
  FaGithub, 
  FaDiscord,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt
} from 'react-icons/fa';

import './Footer.common.css';
import './Footer.light.css';
import './Footer.dark.css';

export interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`Footer Footer--${theme} ${className}`} role="contentinfo">
      <div className="Footer-container">
        {/* Main Footer Content */}
        <div className="Footer-main">
          {/* Company Info */}
          <div className="Footer-section Footer-brand">
            <Link href="/" className="Footer-logo-link" aria-label="MegiLance Home">
              <MegiLanceLogo />
            </Link>
            <p className="Footer-description">
              Empowering freelancers with AI-powered tools and secure USDC payments. 
              Connect with global clients and grow your freelance business.
            </p>
            <div className="Footer-social">
              <a 
                href="https://twitter.com/megilance" 
                target="_blank" 
                rel="noopener noreferrer"
                className="Footer-social-link"
                aria-label="Follow us on Twitter"
              >
                <FaTwitter />
              </a>
              <a 
                href="https://linkedin.com/company/megilance" 
                target="_blank" 
                rel="noopener noreferrer"
                className="Footer-social-link"
                aria-label="Connect with us on LinkedIn"
              >
                <FaLinkedin />
              </a>
              <a 
                href="https://github.com/megilance" 
                target="_blank" 
                rel="noopener noreferrer"
                className="Footer-social-link"
                aria-label="View our GitHub"
              >
                <FaGithub />
              </a>
              <a 
                href="https://discord.gg/megilance" 
                target="_blank" 
                rel="noopener noreferrer"
                className="Footer-social-link"
                aria-label="Join our Discord community"
              >
                <FaDiscord />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div className="Footer-section">
            <h3 className="Footer-section-title">Company</h3>
            <ul className="Footer-links">
              {footerNavItems.company.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="Footer-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div className="Footer-section">
            <h3 className="Footer-section-title">Services</h3>
            <ul className="Footer-links">
              {footerNavItems.services.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="Footer-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="Footer-section">
            <h3 className="Footer-section-title">Support</h3>
            <ul className="Footer-links">
              {footerNavItems.support.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="Footer-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="Footer-section">
            <h3 className="Footer-section-title">Contact</h3>
            <div className="Footer-contact">
              <div className="Footer-contact-item">
                <FaEnvelope className="Footer-contact-icon" />
                <a href="mailto:hello@megilance.com" className="Footer-contact-link">
                  hello@megilance.com
                </a>
              </div>
              <div className="Footer-contact-item">
                <FaPhone className="Footer-contact-icon" />
                <a href="tel:+92-300-1234567" className="Footer-contact-link">
                  +92 300 1234567
                </a>
              </div>
              <div className="Footer-contact-item">
                <FaMapMarkerAlt className="Footer-contact-icon" />
                <span className="Footer-contact-text">
                  Karachi, Pakistan
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="Footer-bottom">
          <div className="Footer-bottom-left">
            <p className="Footer-copyright">
              © {currentYear} MegiLance. All rights reserved.
            </p>
          </div>
          <div className="Footer-bottom-right">
            <ul className="Footer-legal-links">
              {footerNavItems.legal.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="Footer-legal-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
