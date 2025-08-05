import React from 'react';
import Link from 'next/link';
import Button from '@/app/components/Button/Button';
import { FaRocket } from 'react-icons/fa';
import './CTA.common.css';

interface CTAProps {
  theme?: 'light' | 'dark';
}

const CTA: React.FC<CTAProps> = ({ theme = 'light' }) => {
  return (
    <section className="Home-cta-section">
      <div className="Home-container">
        <div className="Home-cta-content">
          <h2 className="Home-cta-title">Ready to Join the Future of Freelancing?</h2>
          <p className="Home-cta-subtitle">Sign up today and get access to AI-powered tools, global projects, and secure crypto payments.</p>
          <Link href="/Signup">
            <Button theme={theme} variant="primary" size="large">
              <FaRocket /> Get Started for Free
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTA;
