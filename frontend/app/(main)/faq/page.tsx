// @AI-HINT: Public FAQ page with FAQPage schema markup for Google Rich Results.
import type { Metadata } from 'next';
import { buildMeta, buildFAQJsonLd, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import FAQ from './FAQ';

// FAQ data duplicated here for JSON-LD (kept in sync with FAQ.tsx faqData)
const faqStructuredData = [
  { question: 'What is MegiLance?', answer: 'MegiLance is a next-generation freelance platform that leverages AI for intelligent matching and blockchain for secure, transparent payments. We focus on providing an production-ready user experience for both clients and freelancers.' },
  { question: 'How do the fees work?', answer: 'MegiLance operates on a simple, tiered fee structure: Basic plan charges 5% per transaction, Standard plan charges 3%, and Premium plan charges just 1%. These are significantly lower than industry standards of 20%+. There are no hidden charges, subscription requirements, or withdrawal penalties.' },
  { question: 'Is my data and payment information secure?', answer: 'Yes. We employ enterprise-grade security including end-to-end encryption, smart contracts for trustless transactions, JWT authentication with secure token rotation, bcrypt password hashing, and regular security audits.' },
  { question: 'What kind of freelancers can I find?', answer: 'MegiLance hosts talent across Software Development, UI/UX Design, AI/ML Engineering, Data Science, Digital Marketing, Content Writing, Video Editing, and many more fields. Our AI matching ensures you connect with the perfect expert.' },
  { question: 'How does the AI matching work?', answer: 'Our 7-factor AI algorithm analyzes Skill Alignment (30%), Experience Level (15%), Budget Compatibility (15%), Response Rate (10%), Success Rate (10%), Location Preference (10%), and Availability (10%) using machine learning for continuous improvement.' },
  { question: 'What payment methods are supported?', answer: 'Credit/Debit Cards via Stripe, Bank Transfers, USDC cryptocurrency on Optimism network for near-zero fee transactions, and PayPal where available. All protected by our smart contract escrow system.' },
  { question: 'How does the escrow system work?', answer: 'Client funds a milestone which is held in escrow. Freelancer completes and submits work. Client reviews and approves. Funds are automatically released. Disputes are handled by our mediation team.' },
  { question: 'Can I use MegiLance from Pakistan?', answer: 'Yes! MegiLance was designed with Pakistani freelancers in mind. Our USDC payment system bypasses traditional banking limitations, allowing freelancers to receive payments with minimal fees and instant settlements.' },
  { question: 'How do I become a verified freelancer?', answer: 'Complete your profile, add skills and portfolio, pass skill assessments, submit ID verification, and maintain good ratings. Verified freelancers get a badge, higher search ranking, and access to premium projects.' },
  { question: 'What if I have a dispute?', answer: 'Try resolving directly via messaging first. If unresolved, file a formal dispute. Our mediation team reviews evidence from both parties and proposes a fair resolution within 5-7 business days.' },
];

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'FAQ - Freelance Marketplace Questions Answered',
    description: 'Answers to common questions about MegiLance freelance marketplace — pricing, security, AI matching, escrow payments, and getting started. The best Upwork alternative FAQ.',
    path: '/faq',
    keywords: [
      'freelance marketplace FAQ', 'how freelancing works', 'freelancer website FAQ',
      'MegiLance FAQ', 'upwork alternative questions', 'escrow payment FAQ',
      'hire freelancers FAQ', 'freelance jobs online questions',
    ],
  });
}

export default function FAQPage() {
  return (
    <>
      <script {...jsonLdScriptProps(buildFAQJsonLd(faqStructuredData))} />
      <script {...jsonLdScriptProps(buildBreadcrumbJsonLd([{ name: 'FAQ', path: '/faq' }]))} />
      <FAQ />
    </>
  );
}
