// @AI-HINT: This is the Home page root component. All styles are per-component only. See Home.common.css, Home.light.css, and Home.dark.css for theming.
import React from "react";
import Link from 'next/link';
import { useTheme } from '@/app/contexts/ThemeContext';
import Navbar from '@/app/components/Navbar/Navbar';
import Footer from '@/app/components/Footer/Footer';
import Button from '@/app/components/Button/Button';
import { publicNavItems, profileMenuItems } from '@/app/config/navigation';
import { FaRocket, FaUsers, FaShieldAlt, FaChartLine, FaWallet, FaRobot } from 'react-icons/fa';
import "./Home.common.css";
import "./Home.light.css";
import "./Home.dark.css";

interface HomeProps {
  theme?: "light" | "dark";
}

const Home: React.FC<HomeProps> = ({ theme = "light" }) => {
  return (
    <div className={`Home Home--${theme}`}>
      {/* Navigation Header */}
      <Navbar 
        navItems={publicNavItems}
        profileMenuItems={profileMenuItems}
        userName="Guest"
        userEmail=""
      />
      
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
          <div className="Home-quick-links">
            <Link href="/how-it-works" className="Home-quick-link">How It Works</Link>
            <Link href="/pricing" className="Home-quick-link">Pricing</Link>
            <Link href="/about" className="Home-quick-link">About Us</Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="Home-features">
        <div className="Home-container">
          <h2 className="Home-section-title">Why Choose MegiLance?</h2>
          <div className="Home-features-grid">
            <div className="Home-feature">
              <div className="Home-feature-icon">
                <FaRobot />
              </div>
              <h3>AI-Powered Tools</h3>
              <p>Smart price estimation, automated proposals, and intelligent job matching powered by advanced AI.</p>
              <Link href="/ai" className="Home-feature-link">Explore AI Tools →</Link>
            </div>
            <div className="Home-feature">
              <div className="Home-feature-icon">
                <FaWallet />
              </div>
              <h3>Crypto Payments</h3>
              <p>Get paid instantly in USDC with secure wallet-to-wallet transactions. No banking delays.</p>
              <Link href="/payments" className="Home-feature-link">Learn About Payments →</Link>
            </div>
            <div className="Home-feature">
              <div className="Home-feature-icon">
                <FaUsers />
              </div>
              <h3>Global Network</h3>
              <p>Connect Pakistani freelancers with international clients for unlimited opportunities.</p>
              <Link href="/freelancers" className="Home-feature-link">Join Network →</Link>
            </div>
            <div className="Home-feature">
              <div className="Home-feature-icon">
                <FaShieldAlt />
              </div>
              <h3>Secure & Transparent</h3>
              <p>Blockchain-based payments with full transparency and fraud protection mechanisms.</p>
              <Link href="/security" className="Home-feature-link">Security Details →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="Home-user-types">
        <div className="Home-container">
          <h2 className="Home-section-title">Perfect for Everyone</h2>
          <div className="Home-user-types-grid">
            <div className="Home-user-type">
              <h3>For Freelancers</h3>
              <p>Build your portfolio, find high-paying clients, and get paid instantly in crypto.</p>
              <ul className="Home-user-type-features">
                <li>AI-powered job matching</li>
                <li>Smart proposal generation</li>
                <li>Instant USDC payments</li>
                <li>Portfolio showcase</li>
              </ul>
              <Link href="/freelancer/dashboard" className="Home-user-type-link">
                <Button theme={theme} variant="primary">Start Freelancing</Button>
              </Link>
            </div>
            <div className="Home-user-type">
              <h3>For Clients</h3>
              <p>Find top talent, manage projects efficiently, and pay securely with crypto.</p>
              <ul className="Home-user-type-features">
                <li>Access to verified freelancers</li>
                <li>Project management tools</li>
                <li>Secure escrow system</li>
                <li>Quality assurance</li>
              </ul>
              <Link href="/client/dashboard" className="Home-user-type-link">
                <Button theme={theme} variant="primary">Hire Talent</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="Home-quick-access">
        <div className="Home-container">
          <h2 className="Home-section-title">Quick Access</h2>
          <div className="Home-quick-access-grid">
            <Link href="/projects" className="Home-quick-access-item">
              <FaChartLine className="Home-quick-access-icon" />
              <span>Browse Projects</span>
            </Link>
            <Link href="/ai/price-estimator" className="Home-quick-access-item">
              <FaRobot className="Home-quick-access-icon" />
              <span>Price Estimator</span>
            </Link>
            <Link href="/blog" className="Home-quick-access-item">
              <FaUsers className="Home-quick-access-icon" />
              <span>Blog & Resources</span>
            </Link>
            <Link href="/contact" className="Home-quick-access-item">
              <FaShieldAlt className="Home-quick-access-icon" />
              <span>Contact Support</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
