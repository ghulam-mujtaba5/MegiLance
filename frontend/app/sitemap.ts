// @AI-HINT: Dynamic sitemap generation for Google Search Console indexing.
// Covers all public pages, programmatic SEO hire pages, and blog pages.
import type { MetadataRoute } from 'next';

// ── Programmatic SEO: Skill × Industry combinations for /hire/[skill]/[industry] ──
const HIRE_SKILLS = [
  'react-developer', 'python-developer', 'nodejs-developer', 'ui-ux-designer',
  'mobile-developer', 'data-scientist', 'devops-engineer', 'fullstack-developer',
  'wordpress-developer', 'shopify-developer', 'content-writer', 'seo-specialist',
  'video-editor', 'graphic-designer', 'machine-learning-engineer', 'blockchain-developer',
  'flutter-developer', 'angular-developer', 'vue-developer', 'aws-architect',
  'java-developer', 'go-developer', 'rust-developer', 'typescript-developer',
  'ios-developer', 'android-developer', 'cybersecurity-expert', 'cloud-architect',
];

const HIRE_INDUSTRIES = [
  'healthcare', 'fintech', 'ecommerce', 'education', 'real-estate', 'saas',
  'gaming', 'travel', 'logistics', 'media', 'automotive', 'startup',
  'enterprise', 'nonprofit', 'government', 'crypto', 'ai', 'sustainability',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://megilance.com';
  const currentDate = new Date();

  // ── Static / marketing pages ──────────────────────────────────────────
  const topLevelPaths = [
    // Core marketing
    { path: '/', changeFrequency: 'daily', priority: 1 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/how-it-works', changeFrequency: 'monthly', priority: 0.85 },
    { path: '/pricing', changeFrequency: 'weekly', priority: 0.82 },
    { path: '/faq', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.7 },
    
    // Marketplace listings
    { path: '/jobs', changeFrequency: 'hourly', priority: 0.95 },
    { path: '/hire', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/talent', changeFrequency: 'daily', priority: 0.85 },
    { path: '/freelancers', changeFrequency: 'daily', priority: 0.85 },
    { path: '/gigs', changeFrequency: 'daily', priority: 0.85 },
    { path: '/explore', changeFrequency: 'daily', priority: 0.8 },
    
    // Product pages
    { path: '/clients', changeFrequency: 'monthly', priority: 0.78 },
    { path: '/teams', changeFrequency: 'monthly', priority: 0.76 },
    { path: '/enterprise', changeFrequency: 'monthly', priority: 0.75 },
    { path: '/testimonials', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/security', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/support', changeFrequency: 'monthly', priority: 0.68 },
    
    // Content & community
    { path: '/blog', changeFrequency: 'daily', priority: 0.8 },
    { path: '/community', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/careers', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/press', changeFrequency: 'monthly', priority: 0.6 },
    
    // Growth
    { path: '/referral', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/install', changeFrequency: 'yearly', priority: 0.5 },
    
    // Auth (low priority but included for completeness)
    { path: '/login', changeFrequency: 'yearly', priority: 0.4 },
    { path: '/signup', changeFrequency: 'yearly', priority: 0.4 },
    
    // Legal
    { path: '/privacy', changeFrequency: 'monthly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'monthly', priority: 0.3 },
    { path: '/cookies', changeFrequency: 'monthly', priority: 0.3 },
  ];

  const staticPages: MetadataRoute.Sitemap = topLevelPaths.map(({ path, changeFrequency, priority }) => ({
    url: `${baseUrl}${path === '/' ? '' : path}`,
    lastModified: currentDate,
    changeFrequency: changeFrequency as any,
    priority,
  }));

  // ── Programmatic SEO: /hire/[skill] skill directory pages ─────────────
  const skillPages: MetadataRoute.Sitemap = HIRE_SKILLS.map((skill) => ({
    url: `${baseUrl}/hire/${skill}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // ── Programmatic SEO: /hire/[skill]/[industry] combinations ───────────
  // Generate top high-traffic skill × industry combinations for sitemap
  const topSkillIndustryCombos = [
    ['react-developer', 'healthcare'], ['react-developer', 'fintech'], ['react-developer', 'saas'], ['react-developer', 'startup'],
    ['python-developer', 'healthcare'], ['python-developer', 'fintech'], ['python-developer', 'ai'], ['python-developer', 'saas'],
    ['nodejs-developer', 'ecommerce'], ['nodejs-developer', 'saas'], ['nodejs-developer', 'startup'],
    ['fullstack-developer', 'startup'], ['fullstack-developer', 'saas'], ['fullstack-developer', 'fintech'],
    ['mobile-developer', 'healthcare'], ['mobile-developer', 'fintech'], ['mobile-developer', 'ecommerce'],
    ['data-scientist', 'healthcare'], ['data-scientist', 'fintech'], ['data-scientist', 'ai'],
    ['machine-learning-engineer', 'healthcare'], ['machine-learning-engineer', 'fintech'], ['machine-learning-engineer', 'ai'],
    ['devops-engineer', 'saas'], ['devops-engineer', 'fintech'], ['devops-engineer', 'enterprise'],
    ['ui-ux-designer', 'saas'], ['ui-ux-designer', 'fintech'], ['ui-ux-designer', 'ecommerce'], ['ui-ux-designer', 'startup'],
    ['blockchain-developer', 'fintech'], ['blockchain-developer', 'crypto'],
    ['aws-architect', 'enterprise'], ['aws-architect', 'saas'], ['aws-architect', 'fintech'],
    ['wordpress-developer', 'ecommerce'], ['shopify-developer', 'ecommerce'],
    ['content-writer', 'saas'], ['content-writer', 'startup'], ['seo-specialist', 'ecommerce'],
    ['java-developer', 'enterprise'], ['java-developer', 'fintech'],
    ['typescript-developer', 'saas'], ['typescript-developer', 'startup'],
    ['go-developer', 'fintech'], ['go-developer', 'saas'],
    ['ios-developer', 'fintech'], ['ios-developer', 'healthcare'],
    ['android-developer', 'ecommerce'], ['android-developer', 'fintech'],
    ['cybersecurity-expert', 'fintech'], ['cybersecurity-expert', 'enterprise'],
    ['cloud-architect', 'saas'], ['cloud-architect', 'enterprise'],
  ];

  const hirePages: MetadataRoute.Sitemap = topSkillIndustryCombos.map(([skill, industry]) => ({
    url: `${baseUrl}/hire/${skill}/${industry}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  return [...staticPages, ...skillPages, ...hirePages];
}
