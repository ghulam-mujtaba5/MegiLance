// @AI-HINT: Programmatic SEO page for hiring freelancers by skill and industry
// URL pattern: /hire/[skill]/[industry] (e.g., /hire/react-developer/healthcare)

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HireSkillIndustryClient } from './HireSkillIndustryClient';
import { BASE_URL } from '@/lib/seo';

// ============ SKILL & INDUSTRY DATA ============
const SKILLS = {
  'react-developer': { name: 'React Developer', category: 'Frontend', avgRate: 75 },
  'python-developer': { name: 'Python Developer', category: 'Backend', avgRate: 80 },
  'nodejs-developer': { name: 'Node.js Developer', category: 'Backend', avgRate: 70 },
  'ui-ux-designer': { name: 'UI/UX Designer', category: 'Design', avgRate: 65 },
  'mobile-developer': { name: 'Mobile Developer', category: 'Mobile', avgRate: 85 },
  'data-scientist': { name: 'Data Scientist', category: 'Data', avgRate: 95 },
  'devops-engineer': { name: 'DevOps Engineer', category: 'Infrastructure', avgRate: 90 },
  'fullstack-developer': { name: 'Full Stack Developer', category: 'Full Stack', avgRate: 85 },
  'wordpress-developer': { name: 'WordPress Developer', category: 'CMS', avgRate: 50 },
  'shopify-developer': { name: 'Shopify Developer', category: 'E-commerce', avgRate: 60 },
  'content-writer': { name: 'Content Writer', category: 'Writing', avgRate: 40 },
  'seo-specialist': { name: 'SEO Specialist', category: 'Marketing', avgRate: 55 },
  'video-editor': { name: 'Video Editor', category: 'Media', avgRate: 45 },
  'graphic-designer': { name: 'Graphic Designer', category: 'Design', avgRate: 50 },
  'machine-learning-engineer': { name: 'Machine Learning Engineer', category: 'AI/ML', avgRate: 100 },
  'blockchain-developer': { name: 'Blockchain Developer', category: 'Web3', avgRate: 110 },
  'flutter-developer': { name: 'Flutter Developer', category: 'Mobile', avgRate: 75 },
  'angular-developer': { name: 'Angular Developer', category: 'Frontend', avgRate: 70 },
  'vue-developer': { name: 'Vue.js Developer', category: 'Frontend', avgRate: 70 },
  'aws-architect': { name: 'AWS Solutions Architect', category: 'Cloud', avgRate: 120 },
};

const INDUSTRIES = {
  'healthcare': { name: 'Healthcare', icon: '🏥', growth: 'high' },
  'fintech': { name: 'FinTech', icon: '💰', growth: 'high' },
  'ecommerce': { name: 'E-commerce', icon: '🛒', growth: 'medium' },
  'education': { name: 'Education', icon: '📚', growth: 'high' },
  'real-estate': { name: 'Real Estate', icon: '🏠', growth: 'medium' },
  'saas': { name: 'SaaS', icon: '☁️', growth: 'high' },
  'gaming': { name: 'Gaming', icon: '🎮', growth: 'high' },
  'travel': { name: 'Travel & Hospitality', icon: '✈️', growth: 'medium' },
  'logistics': { name: 'Logistics', icon: '📦', growth: 'medium' },
  'media': { name: 'Media & Entertainment', icon: '🎬', growth: 'medium' },
  'automotive': { name: 'Automotive', icon: '🚗', growth: 'medium' },
  'startup': { name: 'Startups', icon: '🚀', growth: 'high' },
  'enterprise': { name: 'Enterprise', icon: '🏢', growth: 'stable' },
  'nonprofit': { name: 'Non-Profit', icon: '❤️', growth: 'stable' },
  'government': { name: 'Government', icon: '🏛️', growth: 'stable' },
  'crypto': { name: 'Cryptocurrency', icon: '₿', growth: 'volatile' },
  'ai': { name: 'AI & Machine Learning', icon: '🤖', growth: 'explosive' },
  'sustainability': { name: 'Sustainability', icon: '🌱', growth: 'high' },
};

interface PageProps {
  params: Promise<{
    skill: string;
    industry: string;
  }>;
}

// ============ STATIC PARAMS FOR SSG ============
export async function generateStaticParams() {
  const params: { skill: string; industry: string }[] = [];
  
  // Generate top 100 combinations for static generation
  const topSkills = ['react-developer', 'python-developer', 'nodejs-developer', 'ui-ux-designer', 'fullstack-developer'];
  const topIndustries = ['healthcare', 'fintech', 'ecommerce', 'saas', 'startup'];
  
  for (const skill of topSkills) {
    for (const industry of topIndustries) {
      params.push({ skill, industry });
    }
  }
  
  return params;
}

// ============ DYNAMIC METADATA ============
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const skill = SKILLS[resolvedParams.skill as keyof typeof SKILLS];
  const industry = INDUSTRIES[resolvedParams.industry as keyof typeof INDUSTRIES];
  
  if (!skill || !industry) {
    return {
      title: 'Hire Freelancers | MegiLance',
      description: 'Find and hire top freelancers for your project.',
    };
  }
  
  const title = `Hire ${skill.name} for ${industry.name} | Top Talent | MegiLance`;
  const description = `Find expert ${skill.name}s specializing in ${industry.name}. Average rate: $${skill.avgRate}/hr. Verified profiles, secure payments, satisfaction guaranteed.`;
  
  return {
    title,
    description,
    keywords: [
      `hire ${skill.name.toLowerCase()}`,
      `${industry.name.toLowerCase()} ${skill.name.toLowerCase()}`,
      `freelance ${skill.name.toLowerCase()}`,
      `${skill.category.toLowerCase()} developer`,
      `${industry.name.toLowerCase()} technology`,
    ],
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/hire/${resolvedParams.skill}/${resolvedParams.industry}`,
      type: 'website',
      siteName: 'MegiLance',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${BASE_URL}/hire/${resolvedParams.skill}/${resolvedParams.industry}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// ============ DATA FETCHING ============
async function getFreelancers(skillSlug: string, industrySlug: string) {
  try {
    // Use internal Docker network URL if available, otherwise localhost
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(
      `${baseUrl}/api/skills/freelancers/match?skill_slug=${skillSlug}&industry_slug=${industrySlug}&limit=6`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch freelancers:', error);
    return [];
  }
}

// ============ PAGE COMPONENT ============
export default async function HireSkillIndustryPage({ params }: PageProps) {
  const resolvedParams = await params;
  const skill = SKILLS[resolvedParams.skill as keyof typeof SKILLS];
  const industry = INDUSTRIES[resolvedParams.industry as keyof typeof INDUSTRIES];
  
  if (!skill || !industry) {
    notFound();
  }

  // Fetch matching freelancers
  const freelancers = await getFreelancers(resolvedParams.skill, resolvedParams.industry);
  
  // Generate related skill suggestions
  const relatedSkills = Object.entries(SKILLS)
    .filter(([key]) => key !== resolvedParams.skill)
    .filter(([, s]) => s.category === skill.category)
    .slice(0, 4);
  
  // Generate related industry suggestions
  const relatedIndustries = Object.entries(INDUSTRIES)
    .filter(([key]) => key !== resolvedParams.industry)
    .slice(0, 4);
  
  // Generate FAQ content
  const faqs = [
    {
      question: `How much does it cost to hire a ${skill.name} for ${industry.name}?`,
      answer: `The average hourly rate for a ${skill.name} specializing in ${industry.name} is $${skill.avgRate}/hr on MegiLance. Rates can range from $${Math.round(skill.avgRate * 0.6)}/hr for entry-level to $${Math.round(skill.avgRate * 1.5)}/hr for senior experts.`,
    },
    {
      question: `What skills should a ${skill.name} have for ${industry.name} projects?`,
      answer: `A ${skill.name} for ${industry.name} should have strong ${skill.category} skills, understanding of ${industry.name} regulations and best practices, experience with industry-specific integrations, and excellent communication skills.`,
    },
    {
      question: `How long does it take to hire a ${skill.name}?`,
      answer: `On MegiLance, you can typically find and hire a qualified ${skill.name} within 24-48 hours. Our AI-powered matching system helps you find the best candidates quickly.`,
    },
    {
      question: `Is it safe to hire freelancers for ${industry.name} projects?`,
      answer: `Yes! MegiLance provides secure payments through escrow, verified freelancer profiles, NDA protection, and dispute resolution. Your ${industry.name} project data is protected with enterprise-grade security.`,
    },
  ];
  
  return (
    <HireSkillIndustryClient
      skill={{
        slug: resolvedParams.skill,
        ...skill,
      }}
      industry={{
        slug: resolvedParams.industry,
        ...industry,
      }}
      relatedSkills={relatedSkills.map(([slug, s]) => ({ slug, ...s }))}
      relatedIndustries={relatedIndustries.map(([slug, i]) => ({ slug, ...i }))}
      faqs={faqs}
      freelancers={freelancers}
    />
  );
}
