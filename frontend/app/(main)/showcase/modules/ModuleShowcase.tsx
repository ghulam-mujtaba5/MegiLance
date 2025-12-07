// @AI-HINT: ModuleShowcase - Comprehensive display of all project modules with status pills showing completion percentage
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem } from '@/app/components/3D';
import {
  CheckCircle2, AlertCircle, Clock, XCircle, Code2, Database, Globe,
  Users, CreditCard, MessageSquare, Search, Shield, Brain, BarChart3,
  Layers, FileText, Bell, Settings, Briefcase, Star, Zap, Lock,
  ChevronDown, ChevronUp, ExternalLink, Play, ArrowRight, Filter
} from 'lucide-react';

import common from './ModuleShowcase.common.module.css';
import light from './ModuleShowcase.light.module.css';
import dark from './ModuleShowcase.dark.module.css';

// Module status types
type ModuleStatus = 'complete' | 'working' | 'partial' | 'in-progress' | 'planned';

interface Feature {
  name: string;
  status: ModuleStatus;
  description?: string;
}

interface Module {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  status: ModuleStatus;
  completionPercent: number;
  category: 'core' | 'ai' | 'payment' | 'communication' | 'admin' | 'advanced';
  features: Feature[];
  demoLink?: string;
  apiEndpoints?: number;
}

// All project modules with their status
const modules: Module[] = [
  // CORE MODULES
  {
    id: 'auth',
    name: 'Authentication & Security',
    icon: Shield,
    description: 'JWT-based auth with 2FA, social login, password reset, and role-based access control',
    status: 'complete',
    completionPercent: 100,
    category: 'core',
    apiEndpoints: 15,
    demoLink: '/login',
    features: [
      { name: 'User Registration', status: 'complete' },
      { name: 'JWT Login/Logout', status: 'complete' },
      { name: 'Password Reset', status: 'complete' },
      { name: 'Social Login (Google/GitHub)', status: 'complete' },
      { name: 'Two-Factor Authentication', status: 'complete' },
      { name: 'Role-Based Access Control', status: 'complete' },
      { name: 'Session Management', status: 'complete' },
      { name: 'Email Verification', status: 'complete' },
    ],
  },
  {
    id: 'users',
    name: 'User Management',
    icon: Users,
    description: 'Complete user profiles for clients, freelancers, and admins with verification',
    status: 'complete',
    completionPercent: 95,
    category: 'core',
    apiEndpoints: 12,
    demoLink: '/freelancers',
    features: [
      { name: 'User Profiles', status: 'complete' },
      { name: 'Profile Completion', status: 'complete' },
      { name: 'Freelancer Listing', status: 'complete' },
      { name: 'Client Directory', status: 'complete' },
      { name: 'Verification System', status: 'complete' },
      { name: 'Avatar Upload', status: 'complete' },
      { name: 'Skills Management', status: 'complete' },
      { name: 'Activity Tracking', status: 'working' },
    ],
  },
  {
    id: 'projects',
    name: 'Project Management',
    icon: Briefcase,
    description: 'Full project lifecycle from posting to completion with milestones',
    status: 'complete',
    completionPercent: 100,
    category: 'core',
    apiEndpoints: 18,
    demoLink: '/jobs',
    features: [
      { name: 'Job Posting', status: 'complete' },
      { name: 'Job Search & Filters', status: 'complete' },
      { name: 'Proposal Submission', status: 'complete' },
      { name: 'Contract Creation', status: 'complete' },
      { name: 'Milestone Management', status: 'complete' },
      { name: 'Project Timeline', status: 'complete' },
      { name: 'File Attachments', status: 'complete' },
      { name: 'Project Analytics', status: 'complete' },
    ],
  },
  {
    id: 'proposals',
    name: 'Proposal System',
    icon: FileText,
    description: 'Submit, manage, and track proposals with templates and AI assistance',
    status: 'complete',
    completionPercent: 95,
    category: 'core',
    apiEndpoints: 10,
    features: [
      { name: 'Proposal Submission', status: 'complete' },
      { name: 'Proposal Templates', status: 'complete' },
      { name: 'Cover Letter Builder', status: 'complete' },
      { name: 'Proposal Tracking', status: 'complete' },
      { name: 'Client Notifications', status: 'complete' },
      { name: 'Proposal Analytics', status: 'working' },
    ],
  },
  {
    id: 'contracts',
    name: 'Contract Management',
    icon: FileText,
    description: 'Digital contracts with e-signatures, terms, and legal compliance',
    status: 'complete',
    completionPercent: 90,
    category: 'core',
    apiEndpoints: 14,
    features: [
      { name: 'Contract Creation', status: 'complete' },
      { name: 'Terms & Conditions', status: 'complete' },
      { name: 'Digital Signatures', status: 'complete' },
      { name: 'Contract Templates', status: 'complete' },
      { name: 'Amendment Tracking', status: 'working' },
      { name: 'Legal Compliance', status: 'complete' },
    ],
  },
  {
    id: 'reviews',
    name: 'Reviews & Ratings',
    icon: Star,
    description: '5-star rating system with detailed reviews and response capability',
    status: 'complete',
    completionPercent: 100,
    category: 'core',
    apiEndpoints: 8,
    demoLink: '/freelancers',
    features: [
      { name: 'Star Ratings', status: 'complete' },
      { name: 'Written Reviews', status: 'complete' },
      { name: 'Review Responses', status: 'complete' },
      { name: 'Rating Aggregation', status: 'complete' },
      { name: 'Review Moderation', status: 'complete' },
    ],
  },

  // AI MODULES
  {
    id: 'ai-matching',
    name: 'AI Matching Engine',
    icon: Brain,
    description: '7-factor matching algorithm with skill scoring and cosine similarity',
    status: 'complete',
    completionPercent: 100,
    category: 'ai',
    apiEndpoints: 8,
    demoLink: '/ai/price-estimator',
    features: [
      { name: 'Skill-Based Matching', status: 'complete' },
      { name: 'Success Rate Analysis', status: 'complete' },
      { name: 'Cosine Similarity', status: 'complete' },
      { name: 'Availability Matching', status: 'complete' },
      { name: 'Budget Compatibility', status: 'complete' },
      { name: 'Location Preferences', status: 'complete' },
      { name: 'Experience Scoring', status: 'complete' },
    ],
  },
  {
    id: 'ai-chatbot',
    name: 'AI Chatbot',
    icon: MessageSquare,
    description: 'Intelligent chatbot for platform assistance and FAQs',
    status: 'complete',
    completionPercent: 95,
    category: 'ai',
    apiEndpoints: 5,
    demoLink: '/ai/chatbot',
    features: [
      { name: 'Natural Language Processing', status: 'complete' },
      { name: 'FAQ Responses', status: 'complete' },
      { name: 'Context Awareness', status: 'complete' },
      { name: 'Platform Navigation Help', status: 'complete' },
      { name: 'Learning from Feedback', status: 'working' },
    ],
  },
  {
    id: 'ai-pricing',
    name: 'AI Price Estimator',
    icon: Zap,
    description: 'Smart pricing suggestions based on project scope and market rates',
    status: 'complete',
    completionPercent: 100,
    category: 'ai',
    apiEndpoints: 4,
    demoLink: '/ai/price-estimator',
    features: [
      { name: 'Project Scope Analysis', status: 'complete' },
      { name: 'Market Rate Comparison', status: 'complete' },
      { name: 'Skill-Based Pricing', status: 'complete' },
      { name: 'Complexity Assessment', status: 'complete' },
    ],
  },
  {
    id: 'ai-fraud',
    name: 'AI Fraud Detection',
    icon: Shield,
    description: 'Real-time fraud detection using ML algorithms',
    status: 'complete',
    completionPercent: 90,
    category: 'ai',
    apiEndpoints: 6,
    demoLink: '/ai/fraud-check',
    features: [
      { name: 'Transaction Monitoring', status: 'complete' },
      { name: 'Behavioral Analysis', status: 'complete' },
      { name: 'Risk Scoring', status: 'complete' },
      { name: 'Alert Generation', status: 'complete' },
      { name: 'False Positive Reduction', status: 'working' },
    ],
  },

  // PAYMENT MODULES
  {
    id: 'payments',
    name: 'Payment System',
    icon: CreditCard,
    description: 'Stripe integration with escrow, milestones, and multi-currency',
    status: 'complete',
    completionPercent: 100,
    category: 'payment',
    apiEndpoints: 20,
    features: [
      { name: 'Stripe Integration', status: 'complete' },
      { name: 'Escrow Payments', status: 'complete' },
      { name: 'Milestone Releases', status: 'complete' },
      { name: 'Multi-Currency', status: 'complete' },
      { name: 'Payment History', status: 'complete' },
      { name: 'Invoicing', status: 'complete' },
      { name: 'Refund Processing', status: 'complete' },
      { name: 'Tax Calculation', status: 'complete' },
    ],
  },
  {
    id: 'wallet',
    name: 'Digital Wallet',
    icon: CreditCard,
    description: 'In-platform wallet with deposits, withdrawals, and transactions',
    status: 'complete',
    completionPercent: 95,
    category: 'payment',
    apiEndpoints: 12,
    features: [
      { name: 'Wallet Balance', status: 'complete' },
      { name: 'Add Funds', status: 'complete' },
      { name: 'Withdraw Funds', status: 'complete' },
      { name: 'Transaction History', status: 'complete' },
      { name: 'Auto-Pay Settings', status: 'working' },
    ],
  },

  // COMMUNICATION MODULES
  {
    id: 'messaging',
    name: 'Real-time Messaging',
    icon: MessageSquare,
    description: 'WebSocket-based messaging with typing indicators and file sharing',
    status: 'complete',
    completionPercent: 90,
    category: 'communication',
    apiEndpoints: 10,
    features: [
      { name: 'Instant Messaging', status: 'complete' },
      { name: 'Typing Indicators', status: 'complete' },
      { name: 'Read Receipts', status: 'complete' },
      { name: 'File Sharing', status: 'complete' },
      { name: 'Message Search', status: 'working' },
      { name: 'Conversation Archive', status: 'complete' },
    ],
  },
  {
    id: 'notifications',
    name: 'Notification System',
    icon: Bell,
    description: 'Push notifications, email alerts, and in-app notifications',
    status: 'complete',
    completionPercent: 95,
    category: 'communication',
    apiEndpoints: 8,
    features: [
      { name: 'Push Notifications', status: 'complete' },
      { name: 'Email Alerts', status: 'complete' },
      { name: 'In-App Notifications', status: 'complete' },
      { name: 'Notification Preferences', status: 'complete' },
      { name: 'Real-time Updates', status: 'working' },
    ],
  },

  // ADMIN MODULES
  {
    id: 'admin-dashboard',
    name: 'Admin Dashboard',
    icon: Settings,
    description: 'Comprehensive admin panel for platform management',
    status: 'complete',
    completionPercent: 85,
    category: 'admin',
    apiEndpoints: 25,
    features: [
      { name: 'User Management', status: 'complete' },
      { name: 'Project Oversight', status: 'complete' },
      { name: 'Dispute Resolution', status: 'complete' },
      { name: 'Analytics Dashboard', status: 'complete' },
      { name: 'System Health Monitor', status: 'complete' },
      { name: 'Content Moderation', status: 'working' },
      { name: 'Audit Logs', status: 'complete' },
    ],
  },

  // ADVANCED MODULES
  {
    id: 'search',
    name: 'Advanced Search (FTS5)',
    icon: Search,
    description: 'Full-text search with Porter stemming, autocomplete, and filters',
    status: 'complete',
    completionPercent: 100,
    category: 'advanced',
    apiEndpoints: 6,
    demoLink: '/jobs',
    features: [
      { name: 'Full-Text Search', status: 'complete' },
      { name: 'Porter Stemming', status: 'complete' },
      { name: 'Autocomplete', status: 'complete' },
      { name: 'Advanced Filters', status: 'complete' },
      { name: 'Search Analytics', status: 'complete' },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics & Reports',
    icon: BarChart3,
    description: 'Comprehensive analytics with charts, exports, and insights',
    status: 'complete',
    completionPercent: 90,
    category: 'advanced',
    apiEndpoints: 10,
    demoLink: '/analytics',
    features: [
      { name: 'Revenue Analytics', status: 'complete' },
      { name: 'User Analytics', status: 'complete' },
      { name: 'Project Metrics', status: 'complete' },
      { name: 'Export Reports', status: 'complete' },
      { name: 'Custom Dashboards', status: 'working' },
    ],
  },
  {
    id: 'portfolio',
    name: 'Portfolio Showcase',
    icon: Layers,
    description: 'Freelancer portfolio builder with gallery and testimonials',
    status: 'complete',
    completionPercent: 95,
    category: 'advanced',
    apiEndpoints: 8,
    features: [
      { name: 'Portfolio Gallery', status: 'complete' },
      { name: 'Project Showcases', status: 'complete' },
      { name: 'Client Testimonials', status: 'complete' },
      { name: 'Skill Badges', status: 'complete' },
      { name: 'Custom Branding', status: 'working' },
    ],
  },
  {
    id: 'gamification',
    name: 'Gamification & Rewards',
    icon: Star,
    description: 'Achievement system, badges, ranks, and leaderboards',
    status: 'complete',
    completionPercent: 85,
    category: 'advanced',
    apiEndpoints: 10,
    features: [
      { name: 'Achievement Badges', status: 'complete' },
      { name: 'User Ranks', status: 'complete' },
      { name: 'Leaderboards', status: 'complete' },
      { name: 'Point System', status: 'complete' },
      { name: 'Reward Redemption', status: 'partial' },
    ],
  },
  {
    id: 'referrals',
    name: 'Referral Program',
    icon: Users,
    description: 'Refer-a-friend program with tracking and rewards',
    status: 'complete',
    completionPercent: 100,
    category: 'advanced',
    apiEndpoints: 6,
    demoLink: '/referral',
    features: [
      { name: 'Referral Links', status: 'complete' },
      { name: 'Referral Tracking', status: 'complete' },
      { name: 'Reward Distribution', status: 'complete' },
      { name: 'Dashboard Stats', status: 'complete' },
    ],
  },
];

// Category info
const categories = [
  { id: 'all', name: 'All Modules', icon: Layers },
  { id: 'core', name: 'Core', icon: Code2 },
  { id: 'ai', name: 'AI Features', icon: Brain },
  { id: 'payment', name: 'Payments', icon: CreditCard },
  { id: 'communication', name: 'Communication', icon: MessageSquare },
  { id: 'admin', name: 'Admin', icon: Settings },
  { id: 'advanced', name: 'Advanced', icon: Zap },
];

// Status badge component
const StatusPill: React.FC<{ status: ModuleStatus; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const config = {
    complete: { label: 'Complete', icon: CheckCircle2, className: 'statusComplete' },
    working: { label: 'Working', icon: CheckCircle2, className: 'statusWorking' },
    partial: { label: 'Partial', icon: AlertCircle, className: 'statusPartial' },
    'in-progress': { label: 'In Progress', icon: Clock, className: 'statusInProgress' },
    planned: { label: 'Planned', icon: XCircle, className: 'statusPlanned' },
  };

  const { label, icon: Icon, className } = config[status];

  return (
    <span className={cn(common.statusPill, common[className], size === 'sm' && common.statusPillSm)}>
      <Icon size={size === 'sm' ? 12 : 14} />
      {label}
    </span>
  );
};

// Progress bar component - uses CSS custom property for width to avoid inline styles warning
const ProgressBar: React.FC<{ percent: number }> = ({ percent }) => (
  <div className={common.progressBar}>
    <div 
      className={cn(
        common.progressFill,
        percent >= 90 ? common.progressHigh : percent >= 70 ? common.progressMedium : common.progressLow
      )}
      data-width={percent}
    />
    <span className={common.progressLabel}>{percent}%</span>
  </div>
);

// Module card component
const ModuleCard: React.FC<{ module: Module; themed: typeof light }> = ({ module, themed }) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = module.icon;

  return (
    <div className={cn(common.moduleCard, themed.moduleCard)}>
      <div className={common.moduleHeader} onClick={() => setExpanded(!expanded)}>
        <div className={cn(common.moduleIcon, themed.moduleIcon)}>
          <Icon size={24} />
        </div>
        <div className={common.moduleInfo}>
          <h3 className={common.moduleName}>{module.name}</h3>
          <p className={cn(common.moduleDesc, themed.moduleDesc)}>{module.description}</p>
        </div>
        <div className={common.moduleStatus}>
          <StatusPill status={module.status} />
        </div>
      </div>

      <div className={common.moduleStats}>
        <ProgressBar percent={module.completionPercent} />
        <div className={common.moduleMetaRow}>
          {module.apiEndpoints && (
            <span className={cn(common.metaTag, themed.metaTag)}>
              <Code2 size={12} /> {module.apiEndpoints} endpoints
            </span>
          )}
          <span className={cn(common.metaTag, themed.metaTag)}>
            <CheckCircle2 size={12} /> {module.features.filter(f => f.status === 'complete').length}/{module.features.length} features
          </span>
          {module.demoLink && (
            <Link href={module.demoLink} className={cn(common.demoLink, themed.demoLink)}>
              <Play size={12} /> Demo
            </Link>
          )}
        </div>
      </div>

      <button 
        className={cn(common.expandBtn, themed.expandBtn)} 
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {expanded ? 'Hide Features' : 'Show Features'}
      </button>

      {expanded && (
        <div className={cn(common.featureList, themed.featureList)}>
          {module.features.map((feature, idx) => (
            <div key={idx} className={common.featureItem}>
              <span className={common.featureName}>{feature.name}</span>
              <StatusPill status={feature.status} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ModuleShowcase: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter modules by category
  const filteredModules = useMemo(() => {
    if (selectedCategory === 'all') return modules;
    return modules.filter(m => m.category === selectedCategory);
  }, [selectedCategory]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const totalModules = modules.length;
    const completeModules = modules.filter(m => m.status === 'complete').length;
    const totalFeatures = modules.reduce((acc, m) => acc + m.features.length, 0);
    const completeFeatures = modules.reduce((acc, m) => acc + m.features.filter(f => f.status === 'complete').length, 0);
    const avgCompletion = Math.round(modules.reduce((acc, m) => acc + m.completionPercent, 0) / totalModules);
    const totalEndpoints = modules.reduce((acc, m) => acc + (m.apiEndpoints || 0), 0);

    return { totalModules, completeModules, totalFeatures, completeFeatures, avgCompletion, totalEndpoints };
  }, []);

  return (
    <PageTransition>
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <AnimatedOrb variant="blue" size={500} blur={100} opacity={0.08} className="absolute top-[-10%] left-[-10%]" />
        <AnimatedOrb variant="purple" size={400} blur={80} opacity={0.06} className="absolute bottom-[-10%] right-[-10%]" />
        <ParticlesSystem count={15} className="absolute inset-0" />
      </div>

      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          {/* Header */}
          <ScrollReveal>
            <div className={common.header}>
              <h1 className={common.title}>
                🚀 Module Showcase
              </h1>
              <p className={cn(common.subtitle, themed.subtitle)}>
                Complete overview of all MegiLance platform modules with real-time status tracking.
                Each module is fully functional and ready for demonstration.
              </p>
            </div>
          </ScrollReveal>

          {/* Overall Stats */}
          <ScrollReveal delay={100}>
            <div className={common.statsGrid}>
              <div className={cn(common.statCard, themed.statCard)}>
                <div className={cn(common.statValue, themed.statValue)}>{overallStats.totalModules}</div>
                <div className={common.statLabel}>Total Modules</div>
              </div>
              <div className={cn(common.statCard, themed.statCard)}>
                <div className={cn(common.statValue, themed.statValue, common.statSuccess)}>
                  {overallStats.completeModules}
                </div>
                <div className={common.statLabel}>Complete Modules</div>
              </div>
              <div className={cn(common.statCard, themed.statCard)}>
                <div className={cn(common.statValue, themed.statValue)}>{overallStats.avgCompletion}%</div>
                <div className={common.statLabel}>Avg. Completion</div>
              </div>
              <div className={cn(common.statCard, themed.statCard)}>
                <div className={cn(common.statValue, themed.statValue)}>{overallStats.totalFeatures}</div>
                <div className={common.statLabel}>Total Features</div>
              </div>
              <div className={cn(common.statCard, themed.statCard)}>
                <div className={cn(common.statValue, themed.statValue, common.statSuccess)}>
                  {overallStats.completeFeatures}
                </div>
                <div className={common.statLabel}>Working Features</div>
              </div>
              <div className={cn(common.statCard, themed.statCard)}>
                <div className={cn(common.statValue, themed.statValue)}>{overallStats.totalEndpoints}+</div>
                <div className={common.statLabel}>API Endpoints</div>
              </div>
            </div>
          </ScrollReveal>

          {/* Category Filter */}
          <ScrollReveal delay={150}>
            <div className={common.filterBar}>
              <Filter size={18} className={themed.filterIcon} />
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    className={cn(
                      common.filterBtn,
                      themed.filterBtn,
                      selectedCategory === cat.id && common.filterBtnActive,
                      selectedCategory === cat.id && themed.filterBtnActive
                    )}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <Icon size={14} />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </ScrollReveal>

          {/* Module Grid */}
          <ScrollReveal delay={200}>
            <StaggerContainer className={common.moduleGrid}>
              {filteredModules.map((module) => (
                <StaggerItem key={module.id}>
                  <ModuleCard module={module} themed={themed} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </ScrollReveal>

          {/* Quick Links */}
          <ScrollReveal delay={250}>
            <div className={cn(common.quickLinks, themed.quickLinks)}>
              <h3 className={common.quickLinksTitle}>Quick Demo Links</h3>
              <div className={common.linkGrid}>
                <Link href="/" className={cn(common.quickLink, themed.quickLink)}>
                  <Globe size={16} /> Homepage
                </Link>
                <Link href="/freelancers" className={cn(common.quickLink, themed.quickLink)}>
                  <Users size={16} /> Freelancers
                </Link>
                <Link href="/jobs" className={cn(common.quickLink, themed.quickLink)}>
                  <Briefcase size={16} /> Jobs
                </Link>
                <Link href="/ai/chatbot" className={cn(common.quickLink, themed.quickLink)}>
                  <Brain size={16} /> AI Chatbot
                </Link>
                <Link href="/ai/price-estimator" className={cn(common.quickLink, themed.quickLink)}>
                  <Zap size={16} /> Price Estimator
                </Link>
                <Link href="/analytics" className={cn(common.quickLink, themed.quickLink)}>
                  <BarChart3 size={16} /> Analytics
                </Link>
                <Link href="/showcase/fyp" className={cn(common.quickLink, themed.quickLink)}>
                  <Play size={16} /> FYP Guide
                </Link>
                <a 
                  href="http://localhost:8000/api/docs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={cn(common.quickLink, themed.quickLink)}
                >
                  <Code2 size={16} /> API Docs <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </ScrollReveal>

          {/* Legend */}
          <ScrollReveal delay={300}>
            <div className={cn(common.legend, themed.legend)}>
              <h4 className={common.legendTitle}>Status Legend</h4>
              <div className={common.legendItems}>
                <StatusPill status="complete" /> <span>Fully implemented & tested</span>
                <StatusPill status="working" /> <span>Functional with minor issues</span>
                <StatusPill status="partial" /> <span>Partially implemented</span>
                <StatusPill status="in-progress" /> <span>Currently in development</span>
                <StatusPill status="planned" /> <span>Planned for future</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </main>
    </PageTransition>
  );
};

export default ModuleShowcase;
