// @AI-HINT: This is the Home page root component. All styles are per-component only. See Home.common.css, Home.light.css, and Home.dark.css for theming.
'use client';

import React from "react";
import Link from 'next/link';
import Button from '@/app/components/Button/Button';
import { FaRocket, FaUsers, FaShieldAlt } from 'react-icons/fa';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import "./Home.common.css";
import "./Home.light.css";
import "./Home.dark.css";
import "./components/Features.common.css";
import "./components/Features.light.css";
import "./components/Features.dark.css";
import "./components/HowItWorks.common.css";
import "./components/HowItWorks.light.css";
import "./components/HowItWorks.dark.css";
import "./components/Testimonials.common.css";
import "./components/Testimonials.light.css";
import "./components/Testimonials.dark.css";
import "./components/CTA.common.css";
import "./components/CTA.light.css";
import "./components/CTA.dark.css";

interface HomeProps {
  theme?: "light" | "dark";
}

const Home: React.FC<HomeProps> = ({ theme = "light" }) => {
  return (
    <div className={`Home Home--${theme}`}>
      {/* Navigation Header */}
      <header className="Home-header">
        <nav className="Home-nav">
          <div className="Home-nav-brand">
            <Link href="/" className="Home-brand-link">
              <h1 className="Home-brand">MegiLance</h1>
            </Link>
          </div>
          <div className="Home-nav-links">
            <Link href="/how-it-works" className="Home-nav-link">How It Works</Link>
            <Link href="/pricing" className="Home-nav-link">Pricing</Link>
            <Link href="/about" className="Home-nav-link">About</Link>
            <Link href="/blog" className="Home-nav-link">Blog</Link>
            <Link href="/contact" className="Home-nav-link">Contact</Link>
            <Link href="/Login" className="Home-nav-link Home-nav-link--primary">Sign In</Link>
          </div>
        </nav>
      </header>
      
      {/* Hero Section */}
      <section className="Home-hero">
        <div className="Home-hero-content">
          <h1 className="Home-title">MegiLance</h1>
          <p className="Home-tagline">Empowering Freelancers with AI and Secure USDC Payments</p>
          <p className="Home-subtitle">
            The future of freelancing is here. Connect with global clients, get paid instantly in crypto, 
            and leverage AI tools to grow your business.
          </p>
          <div className="Home-cta">
            <Link href="/Signup" className="Home-link">
              <Button theme={theme} variant="primary" size="large">
                <FaRocket /> Get Started Free
              </Button>
            </Link>
            <Link href="/Login" className="Home-link">
              <Button theme={theme} variant="secondary" size="large">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Features />
      <HowItWorks />
      <Testimonials />
      <CTA theme={theme} />

      {/* Footer */}
      <footer className="Home-footer">
        <div className="Home-container">
          <p>&copy; 2024 MegiLance. All rights reserved.</p>
          <div className="Home-footer-links">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/security">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
