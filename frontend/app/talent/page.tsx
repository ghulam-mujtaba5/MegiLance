import type { Metadata } from 'next';
import TalentClient from './TalentClient';
import { buildMeta, buildCollectionPageJsonLd, buildBreadcrumbJsonLd, buildItemListJsonLd, jsonLdScriptProps, BASE_URL, getKeywordsForPage } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Top Freelancer Directory - Browse 10,000+ Verified Experts',
    description: 'Explore MegiLance\'s curated directory of top-rated freelancers. Find verified experts in web development, mobile apps, UI/UX design, AI/ML, data science, content writing, and 50+ skill categories. Average 4.8★ rating.',
    path: '/talent',
    keywords: getKeywordsForPage(['transactional', 'technology', 'industry'], [
      'freelancer directory', 'top rated freelancers', 'verified freelancers',
      'browse freelancer profiles', 'expert freelancers', 'freelance talent pool',
      'hire remote talent', 'global freelancer marketplace',
    ]),
  });
}

const topCategories = [
  { name: 'Web Developers', url: `${BASE_URL}/hire/fullstack-developer`, position: 1 },
  { name: 'Mobile Developers', url: `${BASE_URL}/hire/mobile-developer`, position: 2 },
  { name: 'UI/UX Designers', url: `${BASE_URL}/hire/ui-ux-designer`, position: 3 },
  { name: 'Data Scientists', url: `${BASE_URL}/hire/data-scientist`, position: 4 },
  { name: 'DevOps Engineers', url: `${BASE_URL}/hire/devops-engineer`, position: 5 },
  { name: 'Content Writers', url: `${BASE_URL}/hire/content-writer`, position: 6 },
];

export default function Page() {
  return (
    <>
      <script {...jsonLdScriptProps(
        buildCollectionPageJsonLd('MegiLance Talent Directory', 'Browse top-rated freelancers across 50+ skill categories. Verified profiles, portfolio reviews, and ratings.', '/talent')
      )} />
      <script {...jsonLdScriptProps(
        buildBreadcrumbJsonLd([{ name: 'Talent Directory', path: '/talent' }])
      )} />
      <script {...jsonLdScriptProps(buildItemListJsonLd(topCategories))} />
      <TalentClient />
    </>
  );
}
