// @AI-HINT: Comprehensive Explore/Demo page with ALL real routes, API endpoints, and working navigation links
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem } from '@/app/components/3D';
import { 
  Layers, Code, Database, Users, CreditCard, MessageSquare, 
  Shield, Search, Brain, FileText, BarChart3, Settings,
  ExternalLink, CheckCircle2, Lock, Zap, Globe,
  Briefcase, Award, Bell, Upload, Star, Play,
  Terminal, Server, HardDrive, Activity
} from 'lucide-react';

import common from './Explore.common.module.css';
import light from './Explore.light.module.css';
import dark from './Explore.dark.module.css';

const API_BASE = 'http://localhost:8000';

// ============================================
// ALL REAL PAGE ROUTES FROM THE CODEBASE
// ============================================
const allPages = [
  // ===== PUBLIC PAGES =====
  { route: '/', name: 'Homepage', description: 'Main landing with hero, features, testimonials, AI/blockchain sections', status: 'complete', category: 'public', tech: 'Next.js 16 + Turbopack' },
  { route: '/about', name: 'About Us', description: 'Company mission, team, timeline, values', status: 'complete', category: 'public', tech: 'SSR Page' },
  { route: '/pricing', name: 'Pricing', description: '3-tier plans: Starter $0, Pro $29, Enterprise $99', status: 'complete', category: 'public', tech: 'Interactive Cards' },
  { route: '/how-it-works', name: 'How It Works', description: '4-step process: Post → Match → Collaborate → Pay', status: 'complete', category: 'public', tech: 'Animated Steps' },
  { route: '/contact', name: 'Contact', description: 'Form with email/phone/address, Google Maps embed', status: 'complete', category: 'public', tech: 'React Hook Form' },
  { route: '/blog', name: 'Blog', description: 'Article listings with categories, search, pagination', status: 'complete', category: 'public', tech: 'Dynamic Routes' },
  { route: '/blog/search', name: 'Blog Search', description: 'Full-text blog search with filters', status: 'complete', category: 'public', tech: 'Search API' },
  { route: '/careers', name: 'Careers', description: 'Job listings, company culture, benefits', status: 'complete', category: 'public', tech: 'Static Page' },
  { route: '/faq', name: 'FAQ', description: '20+ questions with accordion UI, search', status: 'complete', category: 'public', tech: 'Collapsible UI' },
  { route: '/freelancers', name: 'Browse Freelancers', description: 'Search freelancers by skill, rate, rating, location', status: 'complete', category: 'public', tech: 'FTS5 Search' },
  { route: '/jobs', name: 'Browse Jobs', description: 'Filter by category, budget, experience, remote', status: 'complete', category: 'public', tech: 'FTS5 Search' },
  { route: '/clients', name: 'For Clients', description: 'Client-focused landing, benefits, CTA', status: 'complete', category: 'public', tech: 'Marketing Page' },
  { route: '/status', name: 'System Status', description: 'Real-time API, DB, service health monitoring', status: 'complete', category: 'public', tech: 'Health API' },
  { route: '/enterprise', name: 'Enterprise', description: 'Custom plans, SLA, dedicated support info', status: 'complete', category: 'public', tech: 'Static Page' },
  { route: '/community', name: 'Community', description: 'Forums, discussions, resources hub', status: 'complete', category: 'public', tech: 'Community Features' },
  { route: '/testimonials', name: 'Testimonials', description: 'Customer success stories, video testimonials', status: 'complete', category: 'public', tech: 'Carousel UI' },
  { route: '/press', name: 'Press', description: 'Media kit, press releases, logos', status: 'complete', category: 'public', tech: 'Static Page' },
  { route: '/talent', name: 'Talent', description: 'Talent showcase and discovery', status: 'complete', category: 'public', tech: 'Search UI' },
  { route: '/teams', name: 'Teams', description: 'Team collaboration features overview', status: 'complete', category: 'public', tech: 'Marketing Page' },
  { route: '/install', name: 'Install PWA', description: 'PWA installation guide and download', status: 'complete', category: 'public', tech: 'PWA Support' },
  { route: '/referral', name: 'Referral Program', description: 'Invite friends, earn rewards, tracking', status: 'complete', category: 'public', tech: 'Referral API' },
  { route: '/security', name: 'Security', description: 'Security practices, certifications, compliance', status: 'complete', category: 'public', tech: 'Static Page' },
  { route: '/cookies', name: 'Cookie Policy', description: 'Cookie usage, preferences, GDPR', status: 'complete', category: 'public', tech: 'Legal Page' },
  { route: '/privacy', name: 'Privacy Policy', description: 'Data handling, user rights, GDPR', status: 'complete', category: 'public', tech: 'Legal Page' },
  { route: '/terms', name: 'Terms of Service', description: 'User agreement, policies, disclaimers', status: 'complete', category: 'public', tech: 'Legal Page' },
  { route: '/analytics', name: 'Analytics', description: 'General analytics page', status: 'complete', category: 'public', tech: 'Charts' },
  { route: '/user-management', name: 'User Management', description: 'User management interface', status: 'complete', category: 'public', tech: 'Admin UI' },
  
  // ===== AUTH PAGES =====
  { route: '/login', name: 'Login', description: 'Email/password + social auth (Google, GitHub)', status: 'complete', category: 'auth', tech: 'JWT Auth' },
  { route: '/signup', name: 'Sign Up', description: 'Registration with role selection (Client/Freelancer)', status: 'complete', category: 'auth', tech: 'Validation' },
  { route: '/forgot-password', name: 'Forgot Password', description: 'Email-based password reset flow', status: 'complete', category: 'auth', tech: 'Email API' },
  { route: '/verify-email', name: 'Verify Email', description: 'Email verification with token', status: 'complete', category: 'auth', tech: 'Token Verify' },
  { route: '/logout', name: 'Logout', description: 'Session termination and redirect', status: 'complete', category: 'auth', tech: 'JWT Clear' },
  { route: '/test-login', name: 'Test Login', description: 'Development testing login page', status: 'complete', category: 'auth', tech: 'Dev Only' },
  { route: '/passwordless', name: 'Passwordless', description: 'Magic link authentication', status: 'complete', category: 'auth', tech: 'Magic Link' },
  { route: '/onboarding', name: 'Onboarding', description: 'New user onboarding flow', status: 'portal', category: 'auth', tech: 'Onboarding' },
  
  // ===== CLIENT PORTAL =====
  { route: '/client/dashboard', name: 'Client Dashboard', description: 'Projects overview, stats, recent activity, quick actions', status: 'portal', category: 'client', tech: 'Real-time Data' },
  { route: '/client/post-job', name: 'Post Job', description: '5-step wizard: Basics → Skills → Scope → Budget → Review', status: 'portal', category: 'client', tech: 'Multi-step Form' },
  { route: '/client/projects', name: 'My Projects', description: 'All projects with status filters, search, pagination', status: 'portal', category: 'client', tech: 'CRUD API' },
  { route: '/client/contracts', name: 'Contracts', description: 'Active/completed contracts, terms, payments', status: 'portal', category: 'client', tech: 'Contract API' },
  { route: '/client/payments', name: 'Payments', description: 'Transaction history, payment methods, invoices', status: 'portal', category: 'client', tech: 'Stripe API' },
  { route: '/client/messages', name: 'Messages', description: 'Real-time chat with freelancers, file sharing', status: 'portal', category: 'client', tech: 'WebSocket' },
  { route: '/client/reviews', name: 'Reviews', description: 'Leave/view reviews for freelancers', status: 'portal', category: 'client', tech: 'Review API' },
  { route: '/client/wallet', name: 'Wallet', description: 'Balance, add funds, transaction history', status: 'portal', category: 'client', tech: 'Wallet API' },
  { route: '/client/freelancers', name: 'Saved Freelancers', description: 'Bookmarked freelancers, invite to jobs', status: 'portal', category: 'client', tech: 'Favorites API' },
  { route: '/client/analytics', name: 'Client Analytics', description: 'Spending, hiring stats, project metrics', status: 'portal', category: 'client', tech: 'Analytics API' },
  { route: '/client/hire', name: 'Direct Hire', description: 'Directly invite freelancer to project', status: 'portal', category: 'client', tech: 'Invite API' },
  { route: '/client/profile', name: 'Client Profile', description: 'Edit company info, logo, description', status: 'portal', category: 'client', tech: 'Profile API' },
  { route: '/client/settings', name: 'Client Settings', description: 'Notifications, privacy, billing settings', status: 'portal', category: 'client', tech: 'Settings API' },
  { route: '/client/help', name: 'Client Help', description: 'Support articles, contact support', status: 'portal', category: 'client', tech: 'Help Center' },
  
  // ===== FREELANCER PORTAL =====
  { route: '/freelancer/dashboard', name: 'Freelancer Dashboard', description: 'Earnings, active jobs, proposal stats, notifications', status: 'portal', category: 'freelancer', tech: 'Real-time Data' },
  { route: '/freelancer/jobs', name: 'Find Jobs', description: 'AI-matched jobs, filters, saved searches', status: 'portal', category: 'freelancer', tech: 'AI Matching' },
  { route: '/freelancer/proposals', name: 'My Proposals', description: 'Submitted proposals, status, response rate', status: 'portal', category: 'freelancer', tech: 'Proposals API' },
  { route: '/freelancer/submit-proposal', name: 'Submit Proposal', description: 'Proposal form with cover letter, budget, timeline', status: 'portal', category: 'freelancer', tech: 'Form Validation' },
  { route: '/freelancer/contracts', name: 'Contracts', description: 'Active contracts, milestones, payments', status: 'portal', category: 'freelancer', tech: 'Contract API' },
  { route: '/freelancer/portfolio', name: 'Portfolio', description: 'Showcase projects, add/edit items', status: 'portal', category: 'freelancer', tech: 'Portfolio API' },
  { route: '/freelancer/analytics', name: 'Analytics', description: 'Earnings charts, profile views, response rate', status: 'portal', category: 'freelancer', tech: 'Analytics API' },
  { route: '/freelancer/wallet', name: 'Wallet', description: 'Earnings, withdrawals, payment history', status: 'portal', category: 'freelancer', tech: 'Wallet API' },
  { route: '/freelancer/withdraw', name: 'Withdraw', description: 'Withdraw funds to bank/PayPal/crypto', status: 'portal', category: 'freelancer', tech: 'Payout API' },
  { route: '/freelancer/invoices', name: 'Invoices', description: 'Generate and manage invoices', status: 'portal', category: 'freelancer', tech: 'Invoice API' },
  { route: '/freelancer/referrals', name: 'Referrals', description: 'Invite friends, track earnings, referral link', status: 'portal', category: 'freelancer', tech: 'Referral API' },
  { route: '/freelancer/gamification', name: 'Achievements', description: 'Badges, ranks, XP points, leaderboard', status: 'portal', category: 'freelancer', tech: 'Gamification API' },
  { route: '/freelancer/profile', name: 'Profile', description: 'Edit bio, skills, hourly rate, availability', status: 'portal', category: 'freelancer', tech: 'Profile API' },
  { route: '/freelancer/settings', name: 'Settings', description: 'Account, notifications, privacy settings', status: 'portal', category: 'freelancer', tech: 'Settings API' },
  { route: '/freelancer/messages', name: 'Messages', description: 'Real-time chat with clients', status: 'portal', category: 'freelancer', tech: 'WebSocket' },
  { route: '/freelancer/reviews', name: 'Reviews', description: 'View reviews from clients', status: 'portal', category: 'freelancer', tech: 'Review API' },
  { route: '/freelancer/availability', name: 'Availability', description: 'Set working hours, calendar', status: 'portal', category: 'freelancer', tech: 'Calendar API' },
  { route: '/freelancer/rate-cards', name: 'Rate Cards', description: 'Define service packages and rates', status: 'portal', category: 'freelancer', tech: 'Rate Cards API' },
  { route: '/freelancer/assessments', name: 'Assessments', description: 'Skill tests, certifications', status: 'portal', category: 'freelancer', tech: 'Assessment API' },
  { route: '/freelancer/verification', name: 'Verification', description: 'ID verification, background check', status: 'portal', category: 'freelancer', tech: 'KYC API' },
  { route: '/freelancer/templates', name: 'Templates', description: 'Proposal and contract templates', status: 'portal', category: 'freelancer', tech: 'Templates API' },
  { route: '/freelancer/help', name: 'Help', description: 'Support center, FAQs', status: 'portal', category: 'freelancer', tech: 'Help Center' },
  
  // ===== ADMIN PORTAL =====
  { route: '/admin/dashboard', name: 'Admin Dashboard', description: 'Platform stats, revenue, user growth, alerts', status: 'portal', category: 'admin', tech: 'Admin API' },
  { route: '/admin/users', name: 'User Management', description: 'View/edit/ban users, roles, verification', status: 'portal', category: 'admin', tech: 'Users API' },
  { route: '/admin/projects', name: 'Projects', description: 'All projects, moderation, disputes', status: 'portal', category: 'admin', tech: 'Projects API' },
  { route: '/admin/disputes', name: 'Disputes', description: 'Dispute queue, resolution, refunds', status: 'portal', category: 'admin', tech: 'Disputes API' },
  { route: '/admin/payments', name: 'Payments', description: 'All transactions, refunds, payouts', status: 'portal', category: 'admin', tech: 'Payments API' },
  { route: '/admin/analytics', name: 'Analytics', description: 'Platform-wide analytics, charts', status: 'portal', category: 'admin', tech: 'Analytics API' },
  { route: '/admin/fraud-detection', name: 'Fraud Detection', description: 'AI fraud alerts, suspicious activity', status: 'portal', category: 'admin', tech: 'Fraud API' },
  { route: '/admin/audit', name: 'Audit Logs', description: 'System audit trail, user actions', status: 'portal', category: 'admin', tech: 'Audit API' },
  { route: '/admin/ai-monitoring', name: 'AI Monitoring', description: 'AI system performance, accuracy', status: 'portal', category: 'admin', tech: 'AI Metrics' },
  { route: '/admin/skills', name: 'Skills', description: 'Manage skill taxonomy, categories', status: 'portal', category: 'admin', tech: 'Skills API' },
  { route: '/admin/compliance', name: 'Compliance', description: 'GDPR, legal compliance tools', status: 'portal', category: 'admin', tech: 'Compliance API' },
  { route: '/admin/settings', name: 'Settings', description: 'Platform configuration', status: 'portal', category: 'admin', tech: 'Config API' },
  { route: '/admin/webhooks', name: 'Webhooks', description: 'Webhook configuration, logs', status: 'portal', category: 'admin', tech: 'Webhooks API' },
  { route: '/admin/api-keys', name: 'API Keys', description: 'Manage API keys, rate limits', status: 'portal', category: 'admin', tech: 'API Keys' },
  { route: '/admin/messages', name: 'Messages', description: 'Platform-wide messaging', status: 'portal', category: 'admin', tech: 'Admin Messages' },
  { route: '/admin/support', name: 'Support', description: 'Support ticket management', status: 'portal', category: 'admin', tech: 'Support API' },
  
  // ===== AI FEATURES =====
  { route: '/ai', name: 'AI Hub', description: 'AI tools overview and access', status: 'complete', category: 'ai', tech: 'AI Services' },
  { route: '/ai/chatbot', name: 'AI Chatbot', description: 'Intelligent assistant for platform help, proposals', status: 'complete', category: 'ai', tech: 'OpenAI GPT-4' },
  { route: '/ai/price-estimator', name: 'AI Price Estimator', description: 'ML-based project cost estimation', status: 'complete', category: 'ai', tech: 'ML Model' },
  { route: '/ai/fraud-check', name: 'AI Fraud Check', description: 'AI fraud detection and risk scoring', status: 'complete', category: 'ai', tech: 'Fraud ML' },
  
  // ===== SHOWCASE PAGES =====
  { route: '/explore', name: 'Explore', description: 'This page - complete platform overview', status: 'complete', category: 'public', tech: 'Demo Page' },
  { route: '/showcase/health', name: 'System Health', description: 'Real-time API and database health status', status: 'complete', category: 'public', tech: 'Health API' },
  { route: '/showcase/fyp', name: 'FYP Evaluation', description: 'FYP demo script, commands, checklist', status: 'complete', category: 'public', tech: 'Demo Guide' },
];

// ============================================
// REAL API ENDPOINTS FROM BACKEND
// ============================================
const apiEndpoints = [
  // Auth
  { path: '/api/auth/register', method: 'POST', description: 'Register new user' },
  { path: '/api/auth/login', method: 'POST', description: 'Login with email/password' },
  { path: '/api/auth/refresh', method: 'POST', description: 'Refresh JWT token' },
  { path: '/api/auth/me', method: 'GET', description: 'Get current user' },
  { path: '/api/auth/logout', method: 'POST', description: 'Logout user' },
  { path: '/api/auth/forgot-password', method: 'POST', description: 'Request password reset' },
  { path: '/api/auth/reset-password', method: 'POST', description: 'Reset password with token' },
  { path: '/api/auth/verify-email', method: 'POST', description: 'Verify email with token' },
  { path: '/api/auth/2fa/enable', method: 'POST', description: 'Enable 2FA' },
  { path: '/api/auth/2fa/verify', method: 'POST', description: 'Verify 2FA code' },
  // Users
  { path: '/api/users', method: 'GET', description: 'List all users' },
  { path: '/api/users/{id}', method: 'GET', description: 'Get user by ID' },
  { path: '/api/users/{id}', method: 'PUT', description: 'Update user' },
  { path: '/api/users/profile', method: 'GET', description: 'Get current user profile' },
  // Projects
  { path: '/api/projects', method: 'GET', description: 'List projects with filters' },
  { path: '/api/projects', method: 'POST', description: 'Create new project' },
  { path: '/api/projects/{id}', method: 'GET', description: 'Get project details' },
  { path: '/api/projects/{id}', method: 'PUT', description: 'Update project' },
  { path: '/api/projects/{id}', method: 'DELETE', description: 'Delete project' },
  { path: '/api/projects/{id}/proposals', method: 'GET', description: 'Get project proposals' },
  // Proposals
  { path: '/api/proposals', method: 'GET', description: 'List proposals' },
  { path: '/api/proposals', method: 'POST', description: 'Submit proposal' },
  { path: '/api/proposals/{id}', method: 'GET', description: 'Get proposal details' },
  { path: '/api/proposals/{id}/accept', method: 'POST', description: 'Accept proposal' },
  // Contracts
  { path: '/api/contracts', method: 'GET', description: 'List contracts' },
  { path: '/api/contracts', method: 'POST', description: 'Create contract' },
  { path: '/api/contracts/{id}', method: 'GET', description: 'Get contract details' },
  { path: '/api/contracts/{id}/milestones', method: 'GET', description: 'Get milestones' },
  // Payments
  { path: '/api/payments', method: 'GET', description: 'List transactions' },
  { path: '/api/payments/methods', method: 'GET', description: 'Get payment methods' },
  { path: '/api/escrow/create', method: 'POST', description: 'Create escrow' },
  { path: '/api/escrow/release', method: 'POST', description: 'Release escrow' },
  { path: '/api/wallet/balance', method: 'GET', description: 'Get wallet balance' },
  { path: '/api/wallet/withdraw', method: 'POST', description: 'Withdraw funds' },
  // Messages
  { path: '/api/messages', method: 'GET', description: 'Get conversations' },
  { path: '/api/messages/{id}', method: 'GET', description: 'Get messages' },
  { path: '/api/messages', method: 'POST', description: 'Send message' },
  { path: '/ws/chat', method: 'WS', description: 'WebSocket chat' },
  // Search
  { path: '/api/search', method: 'GET', description: 'Global search' },
  { path: '/api/search/freelancers', method: 'GET', description: 'Search freelancers' },
  { path: '/api/search/projects', method: 'GET', description: 'Search projects' },
  { path: '/api/search/advanced', method: 'POST', description: 'Advanced search' },
  // AI
  { path: '/api/ai/matching', method: 'POST', description: '7-factor AI matching' },
  { path: '/api/ai/price-estimate', method: 'POST', description: 'ML price estimation' },
  { path: '/api/ai/fraud-check', method: 'POST', description: 'AI fraud detection' },
  { path: '/api/ai/chatbot', method: 'POST', description: 'AI assistant' },
  { path: '/api/ai/recommendations', method: 'GET', description: 'AI recommendations' },
  // Reviews
  { path: '/api/reviews', method: 'GET', description: 'List reviews' },
  { path: '/api/reviews', method: 'POST', description: 'Create review' },
  // Notifications
  { path: '/api/notifications', method: 'GET', description: 'List notifications' },
  { path: '/api/notifications/read', method: 'POST', description: 'Mark as read' },
  { path: '/ws/notifications', method: 'WS', description: 'WebSocket notifications' },
  // Health
  { path: '/api/health', method: 'GET', description: 'Basic health check' },
  { path: '/api/health/ready', method: 'GET', description: 'Readiness check' },
  { path: '/api/health/advanced', method: 'GET', description: 'Detailed health' },
  // Admin
  { path: '/api/admin/users', method: 'GET', description: 'Admin user list' },
  { path: '/api/admin/analytics', method: 'GET', description: 'Platform analytics' },
  { path: '/api/admin/disputes', method: 'GET', description: 'List disputes' },
  { path: '/api/admin/fraud-alerts', method: 'GET', description: 'Fraud alerts' },
];

// Core modules
const coreModules = [
  {
    name: 'Authentication & Security',
    icon: Shield,
    progress: 95,
    features: ['JWT Auth (30min access / 7-day refresh)', '2FA Authentication (TOTP)', 'Role-based Access Control', 'Password Strength Validation', 'Email Verification Flow', 'Rate Limiting (slowapi)'],
    files: ['backend/app/api/v1/auth.py', 'backend/app/core/security.py'],
    color: '#27AE60'
  },
  {
    name: 'Project Management',
    icon: Briefcase,
    progress: 90,
    features: ['Create/Edit Projects', 'Milestone Tracking', 'File Attachments (S3/Local)', 'Project Templates', 'Skill Requirements'],
    files: ['backend/app/api/v1/projects.py', 'frontend/app/(portal)/client/post-job/'],
    color: '#4573df'
  },
  {
    name: 'Proposal System',
    icon: FileText,
    progress: 85,
    features: ['Submit Proposals', 'Budget & Timeline Estimates', 'Proposal Templates', 'Accept/Reject Workflow', 'Response Rate Tracking'],
    files: ['backend/app/api/v1/proposals.py'],
    color: '#9b59b6'
  },
  {
    name: 'Payment System',
    icon: CreditCard,
    progress: 90,
    features: ['Stripe Integration', 'Escrow System', 'Milestone Payments', 'Invoice Generation (PDF)', 'Wallet Balance Tracking'],
    files: ['backend/app/api/v1/payments.py', 'backend/app/api/v1/escrow.py'],
    color: '#ff9800'
  },
  {
    name: 'Real-time Messaging',
    icon: MessageSquare,
    progress: 80,
    features: ['WebSocket Chat', 'Typing Indicators', 'Read Receipts', 'File Sharing', 'Push Notifications'],
    files: ['backend/app/api/v1/messages.py', 'backend/app/api/v1/websocket.py'],
    color: '#00bcd4'
  },
  {
    name: 'Search & Discovery',
    icon: Search,
    progress: 95,
    features: ['FTS5 Full-text Search', 'Sub-5ms Performance', 'Porter Stemming', 'Autocomplete', 'Advanced Filters'],
    files: ['backend/app/api/v1/search.py', 'backend/app/api/v1/search_advanced.py'],
    color: '#e91e63'
  },
  {
    name: 'AI & Matching',
    icon: Brain,
    progress: 85,
    features: ['7-Factor Matching Algorithm', 'Skill Scoring (30%)', 'Budget Alignment (15%)', 'Cosine Similarity', 'Fraud Detection ML'],
    files: ['backend/app/api/v1/ai_matching.py', 'backend/app/api/v1/fraud_detection.py'],
    color: '#673ab7'
  },
  {
    name: 'Analytics & Reporting',
    icon: BarChart3,
    progress: 75,
    features: ['Revenue Tracking', 'User Metrics', 'Platform KPIs', 'Time Range Selection', 'CSV/PDF Export'],
    files: ['backend/app/api/v1/analytics.py', 'backend/app/api/v1/reports.py'],
    color: '#3f51b5'
  },
  {
    name: 'Review & Ratings',
    icon: Star,
    progress: 90,
    features: ['5-Star System', 'Written Reviews', 'Skill-based Ratings', 'Review Moderation', 'Reputation Scoring'],
    files: ['backend/app/api/v1/reviews.py'],
    color: '#ffc107'
  },
  {
    name: 'Notifications',
    icon: Bell,
    progress: 85,
    features: ['WebSocket Real-time', 'Browser Push', 'Email Notifications', 'Preference Settings', 'Notification History'],
    files: ['backend/app/api/v1/notifications.py', 'backend/app/api/v1/push_notifications.py'],
    color: '#f44336'
  },
  {
    name: 'File Management',
    icon: Upload,
    progress: 80,
    features: ['Drag & Drop Upload', 'Multiple Files', 'Type/Size Validation', 'Image Thumbnails', 'S3 Storage'],
    files: ['backend/app/api/v1/uploads.py'],
    color: '#795548'
  },
  {
    name: 'Admin Portal',
    icon: Settings,
    progress: 70,
    features: ['User Management', 'Dispute Resolution', 'Platform Analytics', 'Content Moderation', 'System Config'],
    files: ['backend/app/api/v1/admin.py', 'frontend/app/(portal)/admin/'],
    color: '#607d8b'
  },
];

// Database tables
const databaseTables = [
  { name: 'users', description: 'User accounts and profiles', columns: 15 },
  { name: 'projects', description: 'Client job postings', columns: 18 },
  { name: 'proposals', description: 'Freelancer proposals', columns: 12 },
  { name: 'contracts', description: 'Active work contracts', columns: 14 },
  { name: 'milestones', description: 'Project milestones', columns: 8 },
  { name: 'payments', description: 'Transaction history', columns: 10 },
  { name: 'escrow', description: 'Escrow holdings', columns: 9 },
  { name: 'messages', description: 'Chat messages', columns: 8 },
  { name: 'conversations', description: 'Chat threads', columns: 6 },
  { name: 'reviews', description: 'User reviews', columns: 10 },
  { name: 'skills', description: 'Skill taxonomy', columns: 5 },
  { name: 'user_skills', description: 'User skill mappings', columns: 4 },
  { name: 'notifications', description: 'User notifications', columns: 9 },
  { name: 'files', description: 'Uploaded files', columns: 8 },
  { name: 'categories', description: 'Project categories', columns: 4 },
  { name: 'wallet', description: 'User wallet balances', columns: 6 },
  { name: 'transactions', description: 'Wallet transactions', columns: 10 },
  { name: 'referrals', description: 'Referral tracking', columns: 7 },
  { name: 'achievements', description: 'Gamification badges', columns: 8 },
  { name: 'user_achievements', description: 'User badge mappings', columns: 4 },
  { name: 'audit_logs', description: 'System audit trail', columns: 8 },
  { name: 'disputes', description: 'Dispute records', columns: 12 },
  { name: 'invoices', description: 'Generated invoices', columns: 11 },
  { name: 'portfolio_items', description: 'Freelancer portfolio', columns: 9 },
  { name: 'saved_searches', description: 'Saved search filters', columns: 6 },
];

type FilterCategory = 'all' | 'public' | 'auth' | 'client' | 'freelancer' | 'admin' | 'ai';

const Explore: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showApiEndpoints, setShowApiEndpoints] = useState(false);
  const [showDatabaseTables, setShowDatabaseTables] = useState(false);

  const filteredPages = useMemo(() => {
    return allPages.filter(page => {
      const matchesFilter = filter === 'all' || page.category === filter;
      const matchesSearch = searchQuery === '' || 
        page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.route.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [filter, searchQuery]);

  const avgProgress = Math.round(coreModules.reduce((acc, m) => acc + m.progress, 0) / coreModules.length);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete': return { label: '✅ Live', className: common.statusComplete };
      case 'pending': return { label: '⏳ Pending', className: common.statusPending };
      case 'portal': return { label: '🔒 Auth Required', className: common.statusPortal };
      default: return { label: status, className: '' };
    }
  };

  const getMethodClass = (method: string) => {
    switch (method) {
      case 'GET': return common.methodGet;
      case 'POST': return common.methodPost;
      case 'PUT': return common.methodPut;
      case 'DELETE': return common.methodDelete;
      case 'WS': return common.methodWs;
      default: return common.methodDefault;
    }
  };

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <AnimatedOrb variant="purple" size={600} blur={100} opacity={0.08} className="absolute top-[-15%] right-[-15%]" />
        <AnimatedOrb variant="blue" size={500} blur={80} opacity={0.06} className="absolute bottom-[-10%] left-[-10%]" />
        <ParticlesSystem count={15} className="absolute inset-0" />
      </div>

      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          {/* Header */}
          <ScrollReveal threshold={0}>
            <div className={common.header}>
              <h1 className={common.title}>🚀 MegiLance Explorer</h1>
              <p className={cn(common.subtitle, themed.subtitle)}>
                Complete interactive map of all {allPages.length} pages, {apiEndpoints.length}+ API endpoints, 
                and {databaseTables.length} database tables. Click any link to navigate directly.
              </p>
              <div className={common.badge}>
                <Zap size={16} />
                {avgProgress}% Overall Completion
              </div>
            </div>
          </ScrollReveal>

          {/* Stats */}
          <ScrollReveal delay={100} threshold={0}>
            <StaggerContainer className={common.statsGrid}>
              <StaggerItem className={cn(common.statCard, themed.statCard)}>
                <div className={cn(common.statValue, themed.statValue)}>{allPages.length}</div>
                <div className={common.statLabel}>Total Pages</div>
              </StaggerItem>
              <StaggerItem className={cn(common.statCard, themed.statCard)}>
                <div className={cn(common.statValue, themed.statValue)}>{apiEndpoints.length}+</div>
                <div className={common.statLabel}>API Endpoints</div>
              </StaggerItem>
              <StaggerItem className={cn(common.statCard, themed.statCard)}>
                <div className={cn(common.statValue, themed.statValue)}>{databaseTables.length}</div>
                <div className={common.statLabel}>Database Tables</div>
              </StaggerItem>
              <StaggerItem className={cn(common.statCard, themed.statCard)}>
                <div className={cn(common.statValue, themed.statValue)}>{coreModules.length}</div>
                <div className={common.statLabel}>Core Modules</div>
              </StaggerItem>
            </StaggerContainer>
          </ScrollReveal>

          {/* Quick Links */}
          <ScrollReveal delay={150} threshold={0}>
            <div className={common.quickLinks}>
              <Link href="/showcase/health" className={cn(common.quickLink, themed.quickLink)}>
                <Activity size={18} /> System Health
              </Link>
              <Link href="/showcase/fyp" className={cn(common.quickLink, themed.quickLink)}>
                <Award size={18} /> FYP Evaluation
              </Link>
              <a href={`${API_BASE}/api/docs`} target="_blank" rel="noopener noreferrer" className={cn(common.quickLink, themed.quickLinkSecondary)}>
                <Code size={18} /> Swagger API <ExternalLink size={14} />
              </a>
              <a href={`${API_BASE}/api/health`} target="_blank" rel="noopener noreferrer" className={cn(common.quickLink, themed.quickLinkSecondary)}>
                <Server size={18} /> Health Check <ExternalLink size={14} />
              </a>
              <Link href="/status" className={cn(common.quickLink, themed.quickLinkSecondary)}>
                <Globe size={18} /> Status Page
              </Link>
            </div>
          </ScrollReveal>

          {/* Toggle Buttons */}
          <ScrollReveal delay={175} threshold={0}>
            <div className={common.toggleSection}>
              <button onClick={() => setShowApiEndpoints(!showApiEndpoints)} className={cn(common.toggleButton, themed.toggleButton)}>
                <Terminal size={18} />
                {showApiEndpoints ? 'Hide' : 'Show'} API Endpoints ({apiEndpoints.length})
              </button>
              <button onClick={() => setShowDatabaseTables(!showDatabaseTables)} className={cn(common.toggleButton, themed.toggleButton)}>
                <Database size={18} />
                {showDatabaseTables ? 'Hide' : 'Show'} Database Tables ({databaseTables.length})
              </button>
            </div>
          </ScrollReveal>

          {/* API Endpoints */}
          {showApiEndpoints && (
            <ScrollReveal threshold={0}>
              <section className={cn(common.section, common.apiSection)}>
                <div className={common.sectionHeader}>
                  <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>
                    <Terminal size={24} /> API Endpoints
                  </h2>
                  <a href={`${API_BASE}/api/docs`} target="_blank" rel="noopener noreferrer" className={common.sectionLink}>
                    Open Swagger UI <ExternalLink size={14} />
                  </a>
                </div>
                <div className={common.apiGrid}>
                  {apiEndpoints.map((endpoint, i) => (
                    <div key={i} className={cn(common.apiCard, themed.apiCard)}>
                      <span className={cn(common.apiMethod, getMethodClass(endpoint.method))}>
                        {endpoint.method}
                      </span>
                      <code className={common.apiPath}>{endpoint.path}</code>
                      <span className={common.apiDesc}>{endpoint.description}</span>
                    </div>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          )}

          {/* Database Tables */}
          {showDatabaseTables && (
            <ScrollReveal threshold={0}>
              <section className={cn(common.section, common.dbSection)}>
                <div className={common.sectionHeader}>
                  <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>
                    <HardDrive size={24} /> Database Tables (Turso/libSQL)
                  </h2>
                </div>
                <div className={common.dbGrid}>
                  {databaseTables.map((table, i) => (
                    <div key={i} className={cn(common.dbCard, themed.dbCard)}>
                      <code className={common.dbName}>{table.name}</code>
                      <span className={common.dbDesc}>{table.description}</span>
                      <span className={common.dbCols}>{table.columns} columns</span>
                    </div>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          )}

          {/* Core Modules */}
          <ScrollReveal delay={200} threshold={0}>
            <section className={common.section}>
              <div className={common.sectionHeader}>
                <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>
                  <Layers size={24} /> Core Modules
                </h2>
                <span className={common.sectionCount}>{coreModules.length} modules</span>
              </div>
              <div className={common.modulesGrid}>
                {coreModules.map((module) => (
                  <StaggerItem key={module.name} className={cn(common.moduleCard, themed.moduleCard)} style={{ '--module-color': module.color, '--module-color-alpha': `${module.color}99`, '--progress-width': `${module.progress}%` } as React.CSSProperties}>
                    <div className={common.moduleHeader}>
                      <div className={cn(common.moduleIcon, themed.moduleIcon)}>
                        <module.icon size={24} />
                      </div>
                      <span className={common.moduleName}>{module.name}</span>
                    </div>
                    <div className={common.moduleProgress}>
                      <div className={cn(common.progressBar, themed.progressBar)}>
                        <div className={cn(common.progressFill, themed.progressFill)} />
                      </div>
                      <div className={common.progressText}>
                        <span>{module.progress}%</span>
                        <span>{module.features.length} features</span>
                      </div>
                    </div>
                    <ul className={common.moduleFeatures}>
                      {module.features.map((feature, i) => (
                        <li key={i}><CheckCircle2 size={14} color={module.color} />{feature}</li>
                      ))}
                    </ul>
                    <div className={common.moduleFiles}>
                      <span className={common.filesLabel}>Files:</span>
                      {module.files.map((file, i) => (
                        <code key={i} className={common.fileName}>{file}</code>
                      ))}
                    </div>
                  </StaggerItem>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* Search and Filter */}
          <ScrollReveal delay={250} threshold={0}>
            <div className={common.searchContainer}>
              <input
                type="text"
                placeholder="Search pages, routes, features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(common.searchInput, themed.searchInput)}
              />
            </div>
            
            <div className={common.filterTabs}>
              {[
                { key: 'all', label: `All (${allPages.length})` },
                { key: 'public', label: `Public (${allPages.filter(p => p.category === 'public').length})` },
                { key: 'auth', label: `Auth (${allPages.filter(p => p.category === 'auth').length})` },
                { key: 'client', label: `Client (${allPages.filter(p => p.category === 'client').length})` },
                { key: 'freelancer', label: `Freelancer (${allPages.filter(p => p.category === 'freelancer').length})` },
                { key: 'admin', label: `Admin (${allPages.filter(p => p.category === 'admin').length})` },
                { key: 'ai', label: `AI (${allPages.filter(p => p.category === 'ai').length})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as FilterCategory)}
                  className={cn(common.filterTab, themed.filterTab, filter === tab.key && common.filterTabActive, filter === tab.key && themed.filterTabActive)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </ScrollReveal>

          {/* Pages Grid */}
          <ScrollReveal delay={300} threshold={0}>
            <section className={common.section}>
              <div className={common.sectionHeader}>
                <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>
                  <Globe size={24} /> All Pages
                </h2>
                <span className={common.sectionCount}>{filteredPages.length} pages</span>
              </div>
              <div className={common.featureGrid}>
                {filteredPages.map((page) => {
                  const badge = getStatusBadge(page.status);
                  const isAccessible = page.status === 'complete';
                  
                  return (
                    <StaggerItem key={page.route} className={cn(common.featureCard, themed.featureCard)}>
                      <div className={common.featureHeader}>
                        <span className={common.featureName}>
                          {page.status === 'portal' && <Lock size={14} />}
                          {page.name}
                        </span>
                        <span className={cn(common.featureStatus, badge.className)}>
                          {badge.label}
                        </span>
                      </div>
                      <p className={common.featureDescription}>{page.description}</p>
                      <div className={common.featureMeta}>
                        <code className={cn(common.featureRoute, themed.featureRoute)}>{page.route}</code>
                        <span className={common.featureTech}>{page.tech}</span>
                      </div>
                      {isAccessible ? (
                        <Link href={page.route} className={cn(common.featureLink, themed.featureLink)}>
                          <Play size={14} /> Open Page
                        </Link>
                      ) : (
                        <span className={cn(common.featureLinkDisabled, themed.featureLinkDisabled)}>
                          <Lock size={14} /> Login Required
                        </span>
                      )}
                    </StaggerItem>
                  );
                })}
              </div>
            </section>
          </ScrollReveal>

          {/* Terminal Commands */}
          <ScrollReveal delay={350} threshold={0}>
            <section className={cn(common.section, common.terminalSection)}>
              <div className={common.sectionHeader}>
                <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>
                  <Terminal size={24} /> Quick Terminal Commands
                </h2>
              </div>
              <div className={cn(common.terminalBox, themed.terminalBox)}>
                <div className={common.terminalHeader}>
                  <span className={cn(common.terminalDot, common.terminalDotRed)} />
                  <span className={cn(common.terminalDot, common.terminalDotYellow)} />
                  <span className={cn(common.terminalDot, common.terminalDotGreen)} />
                  <span className={common.terminalTitle}>PowerShell</span>
                </div>
                <div className={common.terminalContent}>
                  <div className={common.terminalLine}>
                    <span className={common.terminalPrompt}>PS&gt;</span>
                    <span className={common.terminalCmd}>cd frontend; npm run dev</span>
                    <span className={common.terminalComment}># Start frontend on :3000</span>
                  </div>
                  <div className={common.terminalLine}>
                    <span className={common.terminalPrompt}>PS&gt;</span>
                    <span className={common.terminalCmd}>cd backend; uvicorn main:app --reload</span>
                    <span className={common.terminalComment}># Start backend on :8000</span>
                  </div>
                  <div className={common.terminalLine}>
                    <span className={common.terminalPrompt}>PS&gt;</span>
                    <span className={common.terminalCmd}>Start-Process http://localhost:3000</span>
                    <span className={common.terminalComment}># Open in browser</span>
                  </div>
                  <div className={common.terminalLine}>
                    <span className={common.terminalPrompt}>PS&gt;</span>
                    <span className={common.terminalCmd}>Invoke-RestMethod http://localhost:8000/api/health</span>
                    <span className={common.terminalComment}># Test API health</span>
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>
        </div>
      </main>
    </PageTransition>
  );
};

export default Explore;
