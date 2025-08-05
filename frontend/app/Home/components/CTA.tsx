import React from 'react';
import Link from 'next/link';
import Button from '@/app/components/Button/Button';
import { FaRocket } from 'react-icons/fa';
import commonStyles from './CTA.common.module.css';
import lightStyles from './CTA.light.module.css';
import darkStyles from './CTA.dark.module.css';

// @AI-HINT: Call-to-action section for sign up. Now fully theme-switchable using global theme context.
import { useTheme } from '@/app/contexts/ThemeContext';

const CTA: React.FC = () => {
  const { theme } = useTheme();

  return (
    <section className="Home-cta-section">
      <div className="Home-container">
        <div className="Home-cta-content">
          <h2 className="Home-cta-title">Ready to Join the Future of Freelancing?</h2>
          <p className="Home-cta-subtitle">Sign up today and get access to AI-powered tools, global projects, and secure crypto payments.</p>
          <Link href="/Signup">
            <Button variant="primary" size="large">
              <FaRocket /> Get Started for Free
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTA;
