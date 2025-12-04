// @AI-HINT: Portal Dashboard page. Premium billionaire-grade dashboard with 3D floating elements, glassmorphism, and advanced micro-interactions.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';

// Premium 3D components
import { 
  FloatingCube, 
  FloatingSphere, 
  AnimatedOrb,
  ParticlesSystem 
} from '@/app/components/3D';

// Reuse existing dashboard components and types
import DashboardHeader from '@/app/(auth)/auth-dashboard/components/DashboardHeader/DashboardHeader';
import DashboardMetrics from '@/app/(auth)/auth-dashboard/components/DashboardMetrics/DashboardMetrics';
import DashboardRecentProjects from '@/app/(auth)/auth-dashboard/components/DashboardRecentProjects/DashboardRecentProjects';
import DashboardActivityFeed from '@/app/(auth)/auth-dashboard/components/DashboardActivityFeed/DashboardActivityFeed';
import type { User } from '@/app/(auth)/auth-dashboard/types';

// Use (auth) dashboard style tokens for the header component which expects a merged styles object
import authCommon from '@/app/(auth)/auth-dashboard/dashboard.common.module.css';
import authLight from '@/app/(auth)/auth-dashboard/dashboard.light.module.css';
import authDark from '@/app/(auth)/auth-dashboard/dashboard.dark.module.css';

// Page-level styles for layout
import common from './Dashboard.common.module.css';
import light from './Dashboard.light.module.css';
import dark from './Dashboard.dark.module.css';

const Dashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const { user, loading: userLoading } = useUser();
  const themed = resolvedTheme === 'dark' ? dark : light;

  const headerStyles = useMemo(() => {
    const t = resolvedTheme === 'light' ? authLight : authDark;
    return { ...authCommon, ...t } as { [k: string]: string };
  }, [resolvedTheme]);

  const displayUser: User = {
    fullName: user?.fullName ?? 'Guest User',
    email: user?.email ?? 'guest@example.com',
    bio: 'Welcome to your dashboard',
    avatar: user?.avatar ?? '/images/avatars/avatar-1.png',
    notificationCount: user?.notificationCount ?? 0,
  };

  return (
    <PageTransition>
      <main className={cn(common.page, themed.themeWrapper)}>
        {/* Stunning 3D Background Elements */}
        <div className={common.backgroundDecor}>
          <AnimatedOrb variant="blue" size={300} blur={60} opacity={0.4} className={common.orbTopRight} />
          <AnimatedOrb variant="purple" size={250} blur={50} opacity={0.3} className={common.orbBottomLeft} />
          <ParticlesSystem count={8} className={common.particlesBg} />
        </div>
        
        {/* Floating 3D Objects */}
        <div className={common.floating3DElements}>
          <div className={common.floatingElement} style={{ top: '10%', right: '5%' }}>
            <FloatingCube size={40} />
          </div>
          <div className={common.floatingElement} style={{ bottom: '15%', left: '3%' }}>
            <FloatingSphere size={50} variant="gradient" />
          </div>
          <div className={common.floatingElement} style={{ top: '50%', right: '8%' }}>
            <FloatingSphere size={35} variant="purple" />
          </div>
        </div>
        
        <div className={common.container}>
          <ScrollReveal>
            <div className={common.header}>
              <DashboardHeader userRole="client" user={displayUser} styles={headerStyles} />
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={0.2}>
            <div className={common.metrics}>
              <DashboardMetrics />
            </div>
          </ScrollReveal>
          
          <StaggerContainer className={common.contentGrid}>
            <StaggerItem className={common.recentProjects}>
              <DashboardRecentProjects />
            </StaggerItem>
            <StaggerItem className={common.activityFeed}>
              <DashboardActivityFeed />
            </StaggerItem>
          </StaggerContainer>
        </div>
      </main>
    </PageTransition>
  );
};

export default Dashboard;
