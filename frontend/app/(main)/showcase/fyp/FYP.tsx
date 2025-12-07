// @AI-HINT: FYP Evaluation Helper page - Demo script, key metrics, and evaluation aids for final year project presentation
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem } from '@/app/components/3D';
import { 
  GraduationCap, Clock, Users, Code, Database, Globe, 
  CheckCircle2, Play, ExternalLink, FileText, Presentation,
  Target, Award, Zap, Shield, Brain, CreditCard, MessageSquare,
  Search, BarChart3, Star, Layers, BookOpen, Video, Mic
} from 'lucide-react';

import common from './FYP.common.module.css';
import light from './FYP.light.module.css';
import dark from './FYP.dark.module.css';

const demoSteps = [
  {
    title: '1. Introduction & Architecture (3 min)',
    description: 'Present MegiLance as an AI-powered freelancing platform. Show the project structure in VSCode highlighting: backend/ (FastAPI), frontend/ (Next.js), and explain the Turso database migration achievement.',
    duration: '3 minutes',
    links: [
      { label: 'Architecture Doc', href: '/showcase/health' },
      { label: 'Explore Features', href: '/explore' },
    ]
  },
  {
    title: '2. Database Migration Achievement (3 min)',
    description: 'Highlight the Oracle → Turso migration. Show the Turso cloud connection, explain libSQL benefits: cloud-native, cost-effective, fast edge replication. Demonstrate database health check.',
    duration: '3 minutes',
    links: [
      { label: 'System Health', href: '/showcase/health' },
      { label: 'API Docs', href: 'http://localhost:8000/api/docs', external: true },
    ]
  },
  {
    title: '3. Backend API Demo (5 min)',
    description: 'Open Swagger UI and scroll through 120+ endpoints. Demonstrate: Authentication flow (register/login), Project creation, Proposal submission, and Payment integration with Stripe.',
    duration: '5 minutes',
    links: [
      { label: 'Swagger UI', href: 'http://localhost:8000/api/docs', external: true },
      { label: 'Health Check', href: 'http://localhost:8000/api/health/ready', external: true },
    ]
  },
  {
    title: '4. Frontend Showcase (4 min)',
    description: 'Tour the responsive UI: Homepage, Freelancer listings, Job search with filters, AI features (chatbot, price estimator). Show dark/light theme toggle and mobile responsiveness.',
    duration: '4 minutes',
    links: [
      { label: 'Homepage', href: '/' },
      { label: 'Freelancers', href: '/freelancers' },
      { label: 'Jobs', href: '/jobs' },
      { label: 'AI Chatbot', href: '/ai/chatbot' },
    ]
  },
  {
    title: '5. Advanced Features & Conclusion (5 min)',
    description: 'Demonstrate: AI matching algorithm, Real-time notifications, File upload system, Analytics dashboard. Conclude with project stats and future roadmap.',
    duration: '5 minutes',
    links: [
      { label: 'AI Price Estimator', href: '/ai/price-estimator' },
      { label: 'All Features', href: '/explore' },
    ]
  },
];

const keyMetrics = [
  { value: '148', label: 'Total Pages', subtext: 'Frontend routes' },
  { value: '120+', label: 'API Endpoints', subtext: 'RESTful APIs' },
  { value: '25+', label: 'Database Tables', subtext: 'Turso/libSQL' },
  { value: '100+', label: 'UI Components', subtext: 'Reusable React' },
  { value: '12', label: 'Core Modules', subtext: 'Full-stack features' },
  { value: '3', label: 'User Roles', subtext: 'Client/Freelancer/Admin' },
];

const projectHighlights = [
  {
    icon: Database,
    title: 'Oracle → Turso Migration',
    description: 'Successfully migrated entire system from Oracle to Turso (libSQL), improving performance and reducing costs.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Matching',
    description: '7-factor matching algorithm with skill scoring, success rate analysis, and cosine similarity for recommendations.',
  },
  {
    icon: CreditCard,
    title: 'Stripe Payment Integration',
    description: 'Complete payment system with escrow, milestone payments, invoicing, and wallet functionality.',
  },
  {
    icon: MessageSquare,
    title: 'Real-time Communication',
    description: 'WebSocket-based messaging with typing indicators, read receipts, and push notifications.',
  },
  {
    icon: Search,
    title: 'FTS5 Full-text Search',
    description: 'Sub-5ms query performance with Porter stemming, autocomplete, and advanced filtering.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'JWT authentication, 2FA support, role-based access control, and comprehensive audit logging.',
  },
];

const evaluationChecklist = [
  { title: 'Backend running', description: 'uvicorn main:app --reload --port 8000' },
  { title: 'Frontend running', description: 'npm run dev on port 3000' },
  { title: 'Database connected', description: 'Turso cloud or local SQLite' },
  { title: 'API docs accessible', description: 'http://localhost:8000/api/docs' },
  { title: 'Health check passing', description: '/api/health/ready returns ready' },
  { title: 'Theme toggle works', description: 'Light/dark mode switching' },
];

const FYP: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <PageTransition>
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <AnimatedOrb variant="purple" size={500} blur={100} opacity={0.08} className="absolute top-[-10%] right-[-10%]" />
        <AnimatedOrb variant="blue" size={400} blur={80} opacity={0.06} className="absolute bottom-[-10%] left-[-10%]" />
        <ParticlesSystem count={12} className="absolute inset-0" />
      </div>

      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          {/* Header */}
          <ScrollReveal>
            <div className={common.header}>
              <h1 className={common.title}>
                🎓 FYP Evaluation Guide
              </h1>
              <p className={cn(common.subtitle, themed.subtitle)}>
                Complete presentation guide for MegiLance - AI-Powered Freelancing Platform.
                Follow this structured demo script for a successful FYP evaluation.
              </p>
              <div className={common.projectInfo}>
                <span className={cn(common.infoBadge, themed.infoBadge)}>
                  <GraduationCap size={16} /> Final Year Project
                </span>
                <span className={cn(common.infoBadge, themed.infoBadge)}>
                  <Clock size={16} /> ~15 min Demo
                </span>
                <span className={cn(common.infoBadge, themed.infoBadge)}>
                  <Layers size={16} /> Full-Stack Application
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* Key Metrics */}
          <ScrollReveal delay={100}>
            <section className={common.demoSection}>
              <h2 className={common.sectionTitle}>
                <BarChart3 size={24} /> Project Statistics
              </h2>
              <div className={common.metricsGrid}>
                {keyMetrics.map((metric) => (
                  <StaggerItem key={metric.label} className={cn(common.metricCard, themed.metricCard)}>
                    <div className={cn(common.metricValue, themed.metricValue)}>{metric.value}</div>
                    <div className={common.metricLabel}>{metric.label}</div>
                    <div className={common.metricSubtext}>{metric.subtext}</div>
                  </StaggerItem>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* Demo Script */}
          <ScrollReveal delay={150}>
            <section className={common.demoSection}>
              <h2 className={common.sectionTitle}>
                <Presentation size={24} /> Demo Script (15 minutes)
              </h2>
              <div className={common.demoSteps}>
                {demoSteps.map((step, index) => (
                  <StaggerItem key={index} className={cn(common.demoStep, themed.demoStep)}>
                    <div className={cn(common.stepNumber, themed.stepNumber)}>{index + 1}</div>
                    <div className={common.stepContent}>
                      <h3 className={common.stepTitle}>{step.title}</h3>
                      <p className={common.stepDescription}>{step.description}</p>
                      <div className={common.stepDuration}>
                        <Clock size={12} /> {step.duration}
                      </div>
                      <div className={common.stepActions}>
                        {step.links.map((link) => (
                          link.external ? (
                            <a 
                              key={link.label}
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(common.stepLink, themed.stepLink)}
                            >
                              {link.label} <ExternalLink size={12} />
                            </a>
                          ) : (
                            <Link key={link.label} href={link.href} className={cn(common.stepLink, themed.stepLink)}>
                              {link.label}
                            </Link>
                          )
                        ))}
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* Project Highlights */}
          <ScrollReveal delay={200}>
            <section className={common.demoSection}>
              <h2 className={common.sectionTitle}>
                <Star size={24} /> Key Achievements
              </h2>
              <div className={common.highlightsGrid}>
                {projectHighlights.map((highlight) => (
                  <StaggerItem key={highlight.title} className={cn(common.highlightCard, themed.highlightCard)}>
                    <div className={cn(common.highlightIcon, themed.highlightIcon)}>
                      <highlight.icon size={24} />
                    </div>
                    <h3 className={common.highlightTitle}>{highlight.title}</h3>
                    <p className={common.highlightDescription}>{highlight.description}</p>
                  </StaggerItem>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* Pre-Demo Checklist */}
          <ScrollReveal delay={250}>
            <section className={common.demoSection}>
              <h2 className={common.sectionTitle}>
                <CheckCircle2 size={24} /> Pre-Demo Checklist
              </h2>
              <ul className={common.checklist}>
                {evaluationChecklist.map((item) => (
                  <li key={item.title} className={cn(common.checklistItem, themed.checklistItem)}>
                    <CheckCircle2 size={20} color="#27AE60" className={common.checkIcon} />
                    <div className={common.checkContent}>
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
              
              <div className={cn(common.codeBlock, themed.codeBlock)}>
                <code>
                  # Start Backend<br />
                  cd backend && uvicorn main:app --reload --port 8000<br /><br />
                  # Start Frontend (new terminal)<br />
                  cd frontend && npm run dev
                </code>
              </div>
            </section>
          </ScrollReveal>

          {/* Quick Links */}
          <ScrollReveal delay={300}>
            <section className={common.demoSection}>
              <h2 className={common.sectionTitle}>
                <Zap size={24} /> Quick Navigation
              </h2>
              <div className={common.quickLinksGrid}>
                <Link href="/showcase/modules" className={cn(common.quickLinkCard, themed.quickLinkCard)}>
                  <div className={cn(common.quickLinkIcon, themed.quickLinkIcon)}>
                    <Layers size={20} />
                  </div>
                  <span className={common.quickLinkText}>Module Showcase</span>
                </Link>
                <Link href="/explore" className={cn(common.quickLinkCard, themed.quickLinkCard)}>
                  <div className={cn(common.quickLinkIcon, themed.quickLinkIcon)}>
                    <Globe size={20} />
                  </div>
                  <span className={common.quickLinkText}>Explore All Features</span>
                </Link>
                <Link href="/showcase/health" className={cn(common.quickLinkCard, themed.quickLinkCard)}>
                  <div className={cn(common.quickLinkIcon, themed.quickLinkIcon)}>
                    <Target size={20} />
                  </div>
                  <span className={common.quickLinkText}>System Health</span>
                </Link>
                <a href="http://localhost:8000/api/docs" target="_blank" rel="noopener noreferrer" className={cn(common.quickLinkCard, themed.quickLinkCard)}>
                  <div className={cn(common.quickLinkIcon, themed.quickLinkIcon)}>
                    <Code size={20} />
                  </div>
                  <span className={common.quickLinkText}>API Documentation</span>
                </a>
                <Link href="/" className={cn(common.quickLinkCard, themed.quickLinkCard)}>
                  <div className={cn(common.quickLinkIcon, themed.quickLinkIcon)}>
                    <Play size={20} />
                  </div>
                  <span className={common.quickLinkText}>Start Demo Tour</span>
                </Link>
              </div>
            </section>
          </ScrollReveal>
        </div>
      </main>
    </PageTransition>
  );
};

export default FYP;
