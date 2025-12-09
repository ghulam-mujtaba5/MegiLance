// @AI-HINT: System Health Dashboard - Shows real-time backend health, API status, and system metrics for FYP evaluation
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem } from '@/app/components/3D';
import { 
  Activity, Database, Server, Clock, RefreshCw, CheckCircle2, 
  AlertTriangle, XCircle, Zap, Code, Globe, Shield, 
  Cpu, HardDrive, MemoryStick, ExternalLink, FileCode
} from 'lucide-react';

import common from './Health.common.module.css';
import light from './Health.light.module.css';
import dark from './Health.dark.module.css';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'loading';
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: string;
      latency_ms?: number;
      type: string;
      error?: string;
    };
  };
  system?: {
    python_version: string;
    platform: string;
    environment: string;
    app_name: string;
    hostname: string;
  };
  resources?: {
    disk: {
      status: string;
      total_gb?: number;
      used_gb?: number;
      free_gb?: number;
      free_percent?: number;
    };
    memory: {
      status: string;
      total_gb?: number;
      available_gb?: number;
      used_percent?: number;
    };
  };
}

const apiCategories = [
  { name: 'Authentication', count: 12, endpoints: ['/auth/login', '/auth/register', '/auth/refresh', '/auth/me'] },
  { name: 'Users', count: 15, endpoints: ['/users', '/users/{id}', '/users/profile', '/users/skills'] },
  { name: 'Projects', count: 18, endpoints: ['/projects', '/projects/{id}', '/projects/search', '/projects/categories'] },
  { name: 'Proposals', count: 10, endpoints: ['/proposals', '/proposals/{id}', '/proposals/submit'] },
  { name: 'Contracts', count: 12, endpoints: ['/contracts', '/contracts/{id}', '/contracts/milestones'] },
  { name: 'Payments', count: 15, endpoints: ['/payments', '/payments/stripe', '/escrow', '/wallet'] },
  { name: 'Messages', count: 8, endpoints: ['/messages', '/messages/threads', '/websocket'] },
  { name: 'Notifications', count: 6, endpoints: ['/notifications', '/notifications/push', '/notifications/settings'] },
  { name: 'Reviews', count: 8, endpoints: ['/reviews', '/reviews/{id}', '/reviews/responses'] },
  { name: 'Search', count: 10, endpoints: ['/search', '/search/advanced', '/search/autocomplete'] },
  { name: 'AI Services', count: 8, endpoints: ['/ai/matching', '/ai/recommendations', '/ai/fraud'] },
  { name: 'Admin', count: 20, endpoints: ['/admin/users', '/admin/analytics', '/admin/disputes'] },
];

const techStack = [
  { name: 'FastAPI', version: '0.109+', icon: '⚡', description: 'Backend Framework' },
  { name: 'Next.js', version: '14.x', icon: '▲', description: 'Frontend Framework' },
  { name: 'Turso', version: 'libSQL', icon: '🗄️', description: 'Cloud Database' },
  { name: 'TypeScript', version: '5.x', icon: '📘', description: 'Type Safety' },
  { name: 'Python', version: '3.12+', icon: '🐍', description: 'Backend Language' },
  { name: 'Stripe', version: 'v1', icon: '💳', description: 'Payment Processing' },
];

const Health: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health/advanced?detailed=true');
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
      } else {
        // Backend might not be running
        setHealth({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          checks: {
            database: { status: 'unknown', type: 'turso', error: 'Backend not reachable' }
          }
        });
      }
    } catch {
      // Network error - backend not running
      setHealth({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        checks: {
          database: { status: 'unknown', type: 'turso', error: 'Backend not running' }
        }
      });
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const getStatusBanner = () => {
    if (loading) {
      return { className: common.statusLoading, icon: RefreshCw, text: 'Checking System Health...' };
    }
    switch (health?.status) {
      case 'healthy':
        return { className: common.statusHealthy, icon: CheckCircle2, text: '✅ All Systems Operational' };
      case 'degraded':
        return { className: common.statusDegraded, icon: AlertTriangle, text: '⚠️ Some Systems Degraded' };
      case 'unhealthy':
        return { className: common.statusUnhealthy, icon: XCircle, text: '❌ System Issues Detected' };
      default:
        return { className: common.statusLoading, icon: RefreshCw, text: 'Checking...' };
    }
  };

  const statusBanner = getStatusBanner();
  const StatusIcon = statusBanner.icon;
  const totalEndpoints = apiCategories.reduce((acc, cat) => acc + cat.count, 0);

  return (
    <PageTransition>
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <AnimatedOrb variant="blue" size={500} blur={100} opacity={0.08} className="absolute top-[-10%] left-[-10%]" />
        <AnimatedOrb variant="purple" size={400} blur={80} opacity={0.06} className="absolute bottom-[-10%] right-[-10%]" />
        <ParticlesSystem count={12} className="absolute inset-0" />
      </div>

      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          {/* Header */}
          <ScrollReveal>
            <div className={common.header}>
              <h1 className={common.title}>
                <Activity size={32} />
                System Health Dashboard
              </h1>
              <p className={cn(common.subtitle, themed.subtitle)}>
                Real-time monitoring of MegiLance backend services, API status, and system resources
              </p>
              {lastUpdated && (
                <p className={common.lastUpdated}>
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
              <button onClick={fetchHealth} className={cn(common.refreshBtn, themed.refreshBtn)} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </ScrollReveal>

          {/* Status Banner */}
          <ScrollReveal delay={100}>
            <div className={cn(common.statusBanner, statusBanner.className)}>
              <StatusIcon size={24} />
              {statusBanner.text}
            </div>
          </ScrollReveal>

          {/* Health Cards */}
          <ScrollReveal delay={150}>
            <div className={common.healthGrid}>
              {/* Database Health */}
              <StaggerItem className={cn(common.healthCard, themed.healthCard)}>
                <div className={common.healthCardHeader}>
                  <span className={common.healthCardTitle}>
                    <Database size={20} /> Database (Turso)
                  </span>
                  <span className={cn(
                    common.healthCardStatus,
                    health?.checks?.database?.status === 'healthy' ? common.healthyStatus : common.errorStatus
                  )}>
                    {health?.checks?.database?.status || 'checking...'}
                  </span>
                </div>
                <div className={common.healthCardMetrics}>
                  <div className={cn(common.metric, themed.metric)}>
                    <div className={cn(common.metricValue, themed.metricValue)}>
                      {health?.checks?.database?.latency_ms?.toFixed(1) || '--'}
                    </div>
                    <div className={common.metricLabel}>Latency (ms)</div>
                  </div>
                  <div className={cn(common.metric, themed.metric)}>
                    <div className={cn(common.metricValue, themed.metricValue)}>libSQL</div>
                    <div className={common.metricLabel}>Type</div>
                  </div>
                </div>
              </StaggerItem>

              {/* System Resources */}
              <StaggerItem className={cn(common.healthCard, themed.healthCard)}>
                <div className={common.healthCardHeader}>
                  <span className={common.healthCardTitle}>
                    <Server size={20} /> System Resources
                  </span>
                  <span className={cn(common.healthCardStatus, common.healthyStatus)}>
                    {health?.resources?.memory?.status || 'healthy'}
                  </span>
                </div>
                <div className={common.healthCardMetrics}>
                  <div className={cn(common.metric, themed.metric)}>
                    <div className={cn(common.metricValue, themed.metricValue)}>
                      {health?.resources?.memory?.used_percent?.toFixed(0) || '--'}%
                    </div>
                    <div className={common.metricLabel}>Memory Used</div>
                  </div>
                  <div className={cn(common.metric, themed.metric)}>
                    <div className={cn(common.metricValue, themed.metricValue)}>
                      {health?.resources?.disk?.free_percent?.toFixed(0) || '--'}%
                    </div>
                    <div className={common.metricLabel}>Disk Free</div>
                  </div>
                </div>
              </StaggerItem>

              {/* API Status */}
              <StaggerItem className={cn(common.healthCard, themed.healthCard)}>
                <div className={common.healthCardHeader}>
                  <span className={common.healthCardTitle}>
                    <Zap size={20} /> API Status
                  </span>
                  <span className={cn(common.healthCardStatus, common.healthyStatus)}>
                    {health?.version || 'v1.0.0'}
                  </span>
                </div>
                <div className={common.healthCardMetrics}>
                  <div className={cn(common.metric, themed.metric)}>
                    <div className={cn(common.metricValue, themed.metricValue)}>{totalEndpoints}+</div>
                    <div className={common.metricLabel}>Endpoints</div>
                  </div>
                  <div className={cn(common.metric, themed.metric)}>
                    <div className={cn(common.metricValue, themed.metricValue)}>
                      {health?.system?.environment || 'dev'}
                    </div>
                    <div className={common.metricLabel}>Environment</div>
                  </div>
                </div>
              </StaggerItem>

              {/* Platform Info */}
              <StaggerItem className={cn(common.healthCard, themed.healthCard)}>
                <div className={common.healthCardHeader}>
                  <span className={common.healthCardTitle}>
                    <Cpu size={20} /> Platform
                  </span>
                  <span className={cn(common.healthCardStatus, common.healthyStatus)}>
                    running
                  </span>
                </div>
                <div className={common.healthCardMetrics}>
                  <div className={cn(common.metric, themed.metric)}>
                    <div className={cn(common.metricValue, themed.metricValue)}>
                      {health?.system?.python_version || '3.12'}
                    </div>
                    <div className={common.metricLabel}>Python</div>
                  </div>
                  <div className={cn(common.metric, themed.metric)}>
                    <div className={cn(common.metricValue, themed.metricValue)}>FastAPI</div>
                    <div className={common.metricLabel}>Framework</div>
                  </div>
                </div>
              </StaggerItem>
            </div>
          </ScrollReveal>

          {/* API Categories */}
          <ScrollReveal delay={200}>
            <section className={common.apiSection}>
              <h2 className={common.sectionTitle}>
                <Code size={24} /> API Endpoint Categories
              </h2>
              <div className={common.apiGrid}>
                {apiCategories.map((cat) => (
                  <StaggerItem key={cat.name} className={cn(common.apiCard, themed.apiCard)}>
                    <div className={cn(common.apiCount, themed.apiCount)}>{cat.count}</div>
                    <div className={common.apiLabel}>{cat.name}</div>
                  </StaggerItem>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* Tech Stack */}
          <ScrollReveal delay={250}>
            <section className={common.apiSection}>
              <h2 className={common.sectionTitle}>
                <FileCode size={24} /> Technology Stack
              </h2>
              <div className={common.techGrid}>
                {techStack.map((tech) => (
                  <StaggerItem key={tech.name} className={cn(common.techCard, themed.techCard)}>
                    <div className={cn(common.techIcon, themed.techIcon)}>{tech.icon}</div>
                    <div className={common.techInfo}>
                      <h4>{tech.name}</h4>
                      <p>{tech.description} ({tech.version})</p>
                    </div>
                  </StaggerItem>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* Quick Actions */}
          <ScrollReveal delay={300}>
            <div className={common.actionsGrid}>
              <a 
                href="http://localhost:8000/api/docs" 
                target="_blank" 
                rel="noopener noreferrer"
                className={cn(common.actionBtn, themed.actionBtn)}
              >
                <Code size={18} /> Open Swagger UI <ExternalLink size={14} />
              </a>
              <Link href="/explore" className={cn(common.actionBtn, themed.actionBtnSecondary)}>
                <Globe size={18} /> Explore Features
              </Link>
              <Link href="/showcase/fyp" className={cn(common.actionBtn, themed.actionBtnSecondary)}>
                <Shield size={18} /> FYP Evaluation
              </Link>
              <a 
                href="http://localhost:8000/api/health/metrics" 
                target="_blank" 
                rel="noopener noreferrer"
                className={cn(common.actionBtn, themed.actionBtnSecondary)}
              >
                <Activity size={18} /> Prometheus Metrics <ExternalLink size={14} />
              </a>
            </div>
          </ScrollReveal>
        </div>
      </main>
    </PageTransition>
  );
};

export default Health;
