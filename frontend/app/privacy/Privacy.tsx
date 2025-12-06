// @AI-HINT: This is the Privacy Policy page root component. It uses shared legal page styles. All styles are per-component only.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/app/components/Animations';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import commonStyles from '@/app/styles/LegalPage.common.module.css';
import lightStyles from '@/app/styles/LegalPage.light.module.css';
import darkStyles from '@/app/styles/LegalPage.dark.module.css';

const Privacy: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  if (!resolvedTheme) return null;

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
         <AnimatedOrb variant="blue" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
         <AnimatedOrb variant="purple" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
         <ParticlesSystem count={15} className="absolute inset-0" />
         <div className="absolute top-20 left-10 opacity-10 animate-float-slow">
           <FloatingCube size={40} />
         </div>
      </div>

      <main id="main-content" role="main" className={cn(commonStyles.page, themeStyles.page)}>
        <div className={commonStyles.container}>
          <header className={commonStyles.header}>
            <h1 className={commonStyles.title}>Privacy Policy</h1>
            <p className={commonStyles.subtitle}>Last Updated: August 4, 2025</p>
          </header>

          <section className={commonStyles.section} aria-labelledby="privacy-1">
            <h2 id="privacy-1" className={commonStyles.sectionTitle}>1. Information We Collect</h2>
            <p className={commonStyles.sectionContent}>We collect information you provide directly to us, such as when you create an account, fill out a profile, or post a project. This may include your name, email address, skills, and portfolio information. We also collect information automatically, such as your IP address and usage data.</p>
          </section>

          <section className={commonStyles.section} aria-labelledby="privacy-2">
            <h2 id="privacy-2" className={commonStyles.sectionTitle}>2. How We Use Information</h2>
            <p className={commonStyles.sectionContent}>We use the information we collect to operate and improve our platform, including to facilitate project matching, process payments, and personalize your experience. Our AI models may process your data to generate your freelancer rank and provide recommendations.</p>
          </section>

          <section className={commonStyles.section} aria-labelledby="privacy-3">
            <h2 id="privacy-3" className={commonStyles.sectionTitle}>3. Information Sharing</h2>
            <p className={commonStyles.sectionContent}>We do not sell your personal data. We may share information between clients and freelancers as necessary to facilitate a project. We may also share information with third-party service providers for functions like analytics and infrastructure, under strict confidentiality agreements.</p>
          </section>

          <section className={commonStyles.section} aria-labelledby="privacy-4">
            <h2 id="privacy-4" className={commonStyles.sectionTitle}>4. Data Security</h2>
            <p className={commonStyles.sectionContent}>We take reasonable measures to protect your information from loss, theft, misuse, and unauthorized access. However, no security system is impenetrable, and we cannot guarantee the security of our systems 100%.</p>
          </section>

          {/* Add more sections as required */}
        </div>
      </main>
    </PageTransition>
  );
};

export default Privacy;
