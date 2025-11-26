// @AI-HINT: Portal Dashboard page. Premium billionaire-grade dashboard with 3D floating elements, glassmorphism, and advanced micro-interactions.
'use client';

import React, { useMemo, useRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import { useUser } from '@/hooks/useUser';

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

  const headerRef = useRef<HTMLDivElement | null>(null);
  const metricsRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const metricsVisible = useIntersectionObserver(metricsRef, { threshold: 0.1 });
  const contentVisible = useIntersectionObserver(contentRef, { threshold: 0.1 });

  const displayUser: User = {
    fullName: user?.fullName ?? 'Guest User',
    email: user?.email ?? 'guest@example.com',
    bio: 'Welcome to your dashboard',
    avatar: user?.avatar ?? '/images/avatars/avatar-1.png',
    notificationCount: user?.notificationCount ?? 0,
  };

  return (
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
        <div ref={headerRef} className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}>
          <DashboardHeader userRole="client" user={displayUser} styles={headerStyles} />
        </div>
        <div ref={metricsRef} className={cn(common.metrics, metricsVisible ? common.isVisible : common.isNotVisible)}>
          <DashboardMetrics />
        </div>
        <div ref={contentRef} className={cn(common.contentGrid, contentVisible ? common.isVisible : common.isNotVisible)}>
          <div className={common.recentProjects}>
            <DashboardRecentProjects />
          </div>
          <div className={common.activityFeed}>
            <DashboardActivityFeed />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
