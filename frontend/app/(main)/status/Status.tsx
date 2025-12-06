// @AI-HINT: System Status page for MegiLance.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import common from './Status.common.module.css';
import light from './Status.light.module.css';
import dark from './Status.dark.module.css';

const Status: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <PageTransition>
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <ScrollReveal>
            <div className={common.header}>
              <h1 className={common.title}>System Status</h1>
              <p className={cn(common.subtitle, themed.subtitle)}>
                Real-time status of MegiLance services
              </p>
            </div>
          </ScrollReveal>

          <section className={common.section}>
            <h2 className={common.sectionTitle}>Service Status</h2>
            <StaggerContainer className={common.statusGrid}>
              <StaggerItem className={cn(common.statusCard, common.operational)}>
                <h3 className={common.statusTitle}>Platform</h3>
                <p className={common.statusText}>Operational</p>
                <p className={common.statusTime}>Last updated: 2 minutes ago</p>
              </StaggerItem>
              <StaggerItem className={cn(common.statusCard, common.operational)}>
                <h3 className={common.statusTitle}>Payments</h3>
                <p className={common.statusText}>Operational</p>
                <p className={common.statusTime}>Last updated: 5 minutes ago</p>
              </StaggerItem>
              <StaggerItem className={cn(common.statusCard, common.operational)}>
                <h3 className={common.statusTitle}>Messaging</h3>
                <p className={common.statusText}>Operational</p>
                <p className={common.statusTime}>Last updated: 1 minute ago</p>
              </StaggerItem>
              <StaggerItem className={cn(common.statusCard, common.operational)}>
                <h3 className={common.statusTitle}>AI Services</h3>
                <p className={common.statusText}>Operational</p>
                <p className={common.statusTime}>Last updated: 3 minutes ago</p>
              </StaggerItem>
            </StaggerContainer>
          </section>

          <section className={common.section}>
            <h2 className={common.sectionTitle}>Recent Incidents</h2>
            <StaggerContainer className={common.incidentsList}>
              <StaggerItem className={common.incidentCard}>
                <h3 className={common.incidentTitle}>Scheduled Maintenance</h3>
                <p className={common.incidentDate}>December 20, 2024</p>
                <p className={common.incidentDescription}>
                  Scheduled maintenance completed successfully. All services are now operational.
                </p>
                <span className={cn(common.incidentStatus, common.resolved)}>Resolved</span>
              </StaggerItem>
            </StaggerContainer>
          </section>

          <section className={common.section}>
            <h2 className={common.sectionTitle}>Performance Metrics</h2>
            <StaggerContainer className={common.metricsGrid}>
              <StaggerItem className={common.metricCard}>
                <h3 className={common.metricTitle}>Uptime</h3>
                <p className={common.metricValue}>99.9%</p>
                <p className={common.metricPeriod}>Last 30 days</p>
              </StaggerItem>
              <StaggerItem className={common.metricCard}>
                <h3 className={common.metricTitle}>Response Time</h3>
                <p className={common.metricValue}>120ms</p>
                <p className={common.metricPeriod}>Average</p>
              </StaggerItem>
              <StaggerItem className={common.metricCard}>
                <h3 className={common.metricTitle}>Error Rate</h3>
                <p className={common.metricValue}>0.01%</p>
                <p className={common.metricPeriod}>Last 24 hours</p>
              </StaggerItem>
            </StaggerContainer>
          </section>
        </div>
      </main>
    </PageTransition>
  );
};

export default Status; 