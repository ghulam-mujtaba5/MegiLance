// @AI-HINT: Skills directory page listing all available skills for hiring
// Parent page for /hire/[skill]/[industry] programmatic SEO pages

import type { Metadata } from 'next';
import Link from 'next/link';
import { BASE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Hire Freelancers by Skill | MegiLance',
  description: 'Browse top freelancers by skill. Find React developers, Python developers, UI/UX designers, and more. Verified profiles, secure payments.',
  openGraph: {
    title: 'Hire Freelancers by Skill | MegiLance',
    description: 'Find the perfect freelancer for your project.',
    url: `${BASE_URL}/hire`,
  },
  alternates: {
    canonical: `${BASE_URL}/hire`,
  },
};

const SKILL_CATEGORIES = {
  'Development': [
    { slug: 'react-developer', name: 'React Developer', avgRate: 75 },
    { slug: 'python-developer', name: 'Python Developer', avgRate: 80 },
    { slug: 'nodejs-developer', name: 'Node.js Developer', avgRate: 70 },
    { slug: 'fullstack-developer', name: 'Full Stack Developer', avgRate: 85 },
    { slug: 'mobile-developer', name: 'Mobile Developer', avgRate: 85 },
    { slug: 'flutter-developer', name: 'Flutter Developer', avgRate: 75 },
    { slug: 'angular-developer', name: 'Angular Developer', avgRate: 70 },
    { slug: 'vue-developer', name: 'Vue.js Developer', avgRate: 70 },
  ],
  'Design': [
    { slug: 'ui-ux-designer', name: 'UI/UX Designer', avgRate: 65 },
    { slug: 'graphic-designer', name: 'Graphic Designer', avgRate: 50 },
  ],
  'Data & AI': [
    { slug: 'data-scientist', name: 'Data Scientist', avgRate: 95 },
    { slug: 'machine-learning-engineer', name: 'Machine Learning Engineer', avgRate: 100 },
  ],
  'Infrastructure': [
    { slug: 'devops-engineer', name: 'DevOps Engineer', avgRate: 90 },
    { slug: 'aws-architect', name: 'AWS Solutions Architect', avgRate: 120 },
  ],
  'CMS & E-commerce': [
    { slug: 'wordpress-developer', name: 'WordPress Developer', avgRate: 50 },
    { slug: 'shopify-developer', name: 'Shopify Developer', avgRate: 60 },
  ],
  'Marketing & Content': [
    { slug: 'content-writer', name: 'Content Writer', avgRate: 40 },
    { slug: 'seo-specialist', name: 'SEO Specialist', avgRate: 55 },
    { slug: 'video-editor', name: 'Video Editor', avgRate: 45 },
  ],
  'Emerging Tech': [
    { slug: 'blockchain-developer', name: 'Blockchain Developer', avgRate: 110 },
  ],
};

const TOP_INDUSTRIES = [
  { slug: 'healthcare', name: 'Healthcare', icon: '🏥' },
  { slug: 'fintech', name: 'FinTech', icon: '💰' },
  { slug: 'ecommerce', name: 'E-commerce', icon: '🛒' },
  { slug: 'saas', name: 'SaaS', icon: '☁️' },
  { slug: 'startup', name: 'Startups', icon: '🚀' },
  { slug: 'ai', name: 'AI & ML', icon: '🤖' },
];

export default function HireDirectoryPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero */}
      <section className="py-16 px-4 text-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Hire Top Freelancers
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Browse our directory of verified freelancers by skill and industry.
          Find the perfect match for your project.
        </p>
      </section>

      {/* Skills by Category */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">
          Browse by Skill
        </h2>
        
        {Object.entries(SKILL_CATEGORIES).map(([category, skills]) => (
          <div key={category} className="mb-10">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
              {category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {skills.map((skill) => (
                <Link
                  key={skill.slug}
                  href={`/hire/${skill.slug}/startup`}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {skill.name}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                    From ${skill.avgRate}/hr
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Top Industries */}
      <section className="py-12 px-4 max-w-6xl mx-auto bg-gray-50 dark:bg-gray-800">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
          Popular Industries
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {TOP_INDUSTRIES.map((industry) => (
            <Link
              key={industry.slug}
              href={`/hire/react-developer/${industry.slug}`}
              className="flex flex-col items-center p-4 rounded-lg bg-white dark:bg-gray-700 hover:shadow-lg transition-shadow"
            >
              <span className="text-3xl mb-2">{industry.icon}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {industry.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Ready to Start Your Project?
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Post your project for free and receive proposals within hours.
        </p>
        <Link
          href="/signup?role=client"
          className="inline-block px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Post a Project
        </Link>
      </section>
    </main>
  );
}
