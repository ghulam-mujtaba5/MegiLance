// @AI-HINT: Dynamic sitemap generation for Google Search Console indexing.
// Covers all public pages, programmatic SEO hire pages, blog, category pages, and landing pages.
// Maximized for indexing coverage and page ranking.
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
  'php-developer', 'ruby-developer', 'swift-developer', 'kotlin-developer',
  'data-engineer', 'qa-engineer', 'technical-writer', 'product-manager',
  'project-manager', 'business-analyst', 'social-media-manager', 'email-marketer',
  'copywriter', 'illustrator', 'motion-designer', '3d-artist',
];

const HIRE_INDUSTRIES = [
  'healthcare', 'fintech', 'ecommerce', 'education', 'real-estate', 'saas',
  'gaming', 'travel', 'logistics', 'media', 'automotive', 'startup',
  'enterprise', 'nonprofit', 'government', 'crypto', 'ai', 'sustainability',
  'insurance', 'legal', 'agriculture', 'energy', 'fashion', 'food-delivery',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://megilance.site';
  const currentDate = new Date();

  // ── Static / marketing pages ──────────────────────────────────────────
  const topLevelPaths = [
    // Core marketing (highest priority)
    { path: '/', changeFrequency: 'daily', priority: 1.0 },
    { path: '/jobs', changeFrequency: 'hourly', priority: 0.95 },
    { path: '/hire', changeFrequency: 'weekly', priority: 0.92 },
    { path: '/talent', changeFrequency: 'daily', priority: 0.9 },
    { path: '/freelancers', changeFrequency: 'daily', priority: 0.9 },
    { path: '/gigs', changeFrequency: 'daily', priority: 0.88 },

    // Key landing pages
    { path: '/how-it-works', changeFrequency: 'monthly', priority: 0.85 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.82 },
    { path: '/pricing', changeFrequency: 'weekly', priority: 0.85 },
    { path: '/faq', changeFrequency: 'weekly', priority: 0.82 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.75 },
    { path: '/explore', changeFrequency: 'daily', priority: 0.82 },

    // Product / feature pages
    { path: '/clients', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/teams', changeFrequency: 'monthly', priority: 0.78 },
    { path: '/enterprise', changeFrequency: 'monthly', priority: 0.78 },
    { path: '/security', changeFrequency: 'monthly', priority: 0.72 },
    { path: '/testimonials', changeFrequency: 'weekly', priority: 0.75 },
    { path: '/support', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/ai', changeFrequency: 'monthly', priority: 0.72 },

    // Content & community
    { path: '/blog', changeFrequency: 'daily', priority: 0.85 },
    { path: '/blog/search', changeFrequency: 'daily', priority: 0.6 },
    { path: '/community', changeFrequency: 'weekly', priority: 0.72 },
    { path: '/careers', changeFrequency: 'monthly', priority: 0.62 },
    { path: '/press', changeFrequency: 'monthly', priority: 0.6 },

    // Growth / acquisition
    { path: '/referral', changeFrequency: 'monthly', priority: 0.62 },
    { path: '/install', changeFrequency: 'yearly', priority: 0.5 },

    // Auth (low priority but discoverable)
    { path: '/login', changeFrequency: 'yearly', priority: 0.4 },
    { path: '/signup', changeFrequency: 'yearly', priority: 0.45 },

    // Legal pages
    { path: '/privacy', changeFrequency: 'monthly', priority: 0.35 },
    { path: '/terms', changeFrequency: 'monthly', priority: 0.35 },
    { path: '/cookies', changeFrequency: 'monthly', priority: 0.3 },

    // Public showcase / portfolio
    { path: '/profile', changeFrequency: 'daily', priority: 0.68 },

    // Status page
    { path: '/status', changeFrequency: 'daily', priority: 0.45 },
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
    priority: 0.82,
  }));

  // ── Programmatic SEO: /hire/[skill]/[industry] combinations ───────────
  // Generate ALL high-traffic skill × industry combinations for maximum coverage
  const topSkillIndustryCombos: [string, string][] = [];
  
  // Top 10 skills × top 8 industries = 80 pages
  const topSkills = [
    'react-developer', 'python-developer', 'nodejs-developer', 'ui-ux-designer',
    'fullstack-developer', 'mobile-developer', 'data-scientist', 'machine-learning-engineer',
    'devops-engineer', 'blockchain-developer',
  ];
  const topIndustries = [
    'healthcare', 'fintech', 'ecommerce', 'saas', 'startup', 'ai', 'enterprise', 'education',
  ];
  
  for (const skill of topSkills) {
    for (const industry of topIndustries) {
      topSkillIndustryCombos.push([skill, industry]);
    }
  }
  
  // Additional high-value combos
  const additionalCombos: [string, string][] = [
    ['aws-architect', 'enterprise'], ['aws-architect', 'saas'], ['aws-architect', 'fintech'],
    ['cloud-architect', 'saas'], ['cloud-architect', 'enterprise'],
    ['wordpress-developer', 'ecommerce'], ['shopify-developer', 'ecommerce'],
    ['content-writer', 'saas'], ['content-writer', 'startup'], ['content-writer', 'ecommerce'],
    ['seo-specialist', 'ecommerce'], ['seo-specialist', 'saas'], ['seo-specialist', 'startup'],
    ['java-developer', 'enterprise'], ['java-developer', 'fintech'],
    ['typescript-developer', 'saas'], ['typescript-developer', 'startup'],
    ['go-developer', 'fintech'], ['go-developer', 'saas'],
    ['ios-developer', 'fintech'], ['ios-developer', 'healthcare'],
    ['android-developer', 'ecommerce'], ['android-developer', 'fintech'],
    ['cybersecurity-expert', 'fintech'], ['cybersecurity-expert', 'enterprise'], ['cybersecurity-expert', 'healthcare'],
    ['flutter-developer', 'startup'], ['flutter-developer', 'ecommerce'],
    ['angular-developer', 'enterprise'], ['vue-developer', 'saas'],
    ['graphic-designer', 'startup'], ['graphic-designer', 'ecommerce'],
    ['video-editor', 'media'], ['video-editor', 'education'],
    ['php-developer', 'ecommerce'], ['ruby-developer', 'startup'],
    ['data-engineer', 'fintech'], ['data-engineer', 'healthcare'], ['data-engineer', 'ai'],
    ['qa-engineer', 'fintech'], ['qa-engineer', 'enterprise'],
    ['product-manager', 'saas'], ['product-manager', 'startup'],
    ['copywriter', 'saas'], ['copywriter', 'ecommerce'],
    ['social-media-manager', 'ecommerce'], ['social-media-manager', 'startup'],
    ['illustrator', 'gaming'], ['motion-designer', 'media'], ['3d-artist', 'gaming'],
  ];
  
  // Deduplicate
  const allCombos = new Set(topSkillIndustryCombos.map(([s, i]) => `${s}/${i}`));
  for (const [s, i] of additionalCombos) {
    allCombos.add(`${s}/${i}`);
  }

  const hirePages: MetadataRoute.Sitemap = [...allCombos].map((combo) => ({
    url: `${baseUrl}/hire/${combo}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  return [...staticPages, ...skillPages, ...hirePages];
}
