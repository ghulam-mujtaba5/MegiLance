// @AI-HINT: Analytics page scaffold using premium EmptyState and global Toaster.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { useToaster } from '@/app/components/Toast/ToasterProvider';
import Button from '@/app/components/Button/Button';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { BarChart3, Bell } from 'lucide-react';

import commonStyles from './Analytics.common.module.css';
import lightStyles from './Analytics.light.module.css';
import darkStyles from './Analytics.dark.module.css';

const AnalyticsPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const { notify } = useToaster();

  if (!resolvedTheme) return null;

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <PageTransition>
      <main className={cn(commonStyles.page, themeStyles.page)}>
        <div className={commonStyles.container}>
          <ScrollReveal>
            <header className={commonStyles.header}>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Analytics</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Track performance, revenue, and engagement trends.
              </p>
            </header>
          </ScrollReveal>
          
          <ScrollReveal delay={0.1}>
            <EmptyState
              title="Analytics coming soon"
              description="We’re preparing insightful dashboards. Stay tuned for charts and reports."
              icon={<BarChart3 size={48} />}
              action={
                <Button
                  variant="primary"
                  iconBefore={<Bell size={18} />}
                  onClick={() => notify({ 
                    title: 'Subscribed', 
                    description: 'You will be notified when Analytics launches.', 
                    variant: 'success', 
                    duration: 3000 
                  })}
                >
                  Notify Me
                </Button>
              }
            />
          </ScrollReveal>
        </div>
      </main>
    </PageTransition>
  );
};

export default AnalyticsPage;