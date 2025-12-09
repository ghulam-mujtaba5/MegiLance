import { BlogPostCardProps } from '@/app/components/Public/BlogPostCard/BlogPostCard';

// Build API URL with proper fallback for production
const envUrl = process.env.NEXT_PUBLIC_API_URL;
const API_URL = envUrl 
  ? (envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`)
  : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
    ? '/api' 
    : 'http://localhost:8000/api');

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url?: string;
  author: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  is_published: boolean;
  is_news_trend: boolean;
  views: number;
  reading_time: number;
}

// Demo blog posts for fallback when API is unavailable
export const demoPosts: BlogPost[] = [
  {
    id: '1',
    title: 'The Future of AI-Powered Freelancing',
    slug: 'future-ai-powered-freelancing',
    excerpt: 'Discover how artificial intelligence is revolutionizing the way freelancers find work and how businesses connect with top talent.',
    content: `<p>AI is transforming the freelancing landscape in unprecedented ways. From smart matching algorithms to automated project management, the future of work is being shaped by intelligent systems.</p>
      <h2>Smart Matching Technology</h2>
      <p>MegiLance uses a sophisticated 7-factor AI algorithm that analyzes freelancer skills, experience, availability, and work history to match them with the perfect projects. This goes beyond simple keyword matching to understand context, expertise levels, and even communication styles.</p>
      <h2>Automated Workflows</h2>
      <p>AI assistants can now handle routine tasks like scheduling, invoicing, and even initial client communications. This frees up freelancers to focus on what they do best – delivering exceptional work.</p>
      <h2>Predictive Analytics</h2>
      <p>Machine learning models can predict project timelines, budget requirements, and potential issues before they arise. This helps both clients and freelancers plan more effectively.</p>`,
    image_url: '/images/blog/ai-future.svg',
    author: 'MegiLance Team',
    tags: ['AI', 'Freelancing', 'Technology'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_published: true,
    is_news_trend: true,
    views: 1250,
    reading_time: 5
  },
  {
    id: '2',
    title: 'Blockchain Payments: Zero Fees for Freelancers',
    slug: 'blockchain-payments-zero-fees',
    excerpt: 'Learn how MegiLance leverages blockchain technology to eliminate traditional payment fees and ensure instant settlements.',
    content: `<p>Traditional payment processors charge hefty fees that eat into freelancer earnings. MegiLance is changing this with blockchain-powered payments.</p>
      <h2>The Problem with Traditional Payments</h2>
      <p>Credit card processors typically charge 2.9% + $0.30 per transaction. For international payments, this can rise to 4-5%. Wire transfers can cost $25-50 per transaction. These fees add up quickly for active freelancers.</p>
      <h2>Our Blockchain Solution</h2>
      <p>By leveraging cryptocurrency and smart contracts, we've reduced transaction fees to near zero. Payments settle instantly, 24/7, without waiting for bank business hours.</p>
      <h2>Escrow Security</h2>
      <p>Smart contracts hold funds in escrow until work is approved, protecting both clients and freelancers. No more chasing payments or dealing with chargebacks.</p>`,
    image_url: '/images/blog/blockchain.svg',
    author: 'Crypto Expert',
    tags: ['Blockchain', 'Payments', 'Crypto'],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    is_published: true,
    is_news_trend: false,
    views: 890,
    reading_time: 7
  },
  {
    id: '3',
    title: '10 Tips for Building Your Freelance Career in 2025',
    slug: 'tips-freelance-career-2025',
    excerpt: 'Expert advice on establishing yourself as a successful freelancer in the modern gig economy.',
    content: `<p>The freelance economy continues to grow, with over 70 million Americans freelancing in 2024. Here's how to stand out and succeed.</p>
      <h2>1. Build a Strong Portfolio</h2>
      <p>Your portfolio is your most powerful marketing tool. Showcase your best work with detailed case studies that highlight your process and results.</p>
      <h2>2. Specialize in a Niche</h2>
      <p>Generalists compete on price; specialists compete on expertise. Find your niche and become the go-to expert in that area.</p>
      <h2>3. Invest in Your Skills</h2>
      <p>The market evolves rapidly. Dedicate time each week to learning new tools, techniques, and industry trends.</p>
      <h2>4. Network Strategically</h2>
      <p>Join communities, attend virtual events, and build genuine relationships. Most high-quality work comes through referrals.</p>
      <h2>5. Set Clear Boundaries</h2>
      <p>Define your working hours, communication preferences, and project scope upfront. This prevents burnout and scope creep.</p>`,
    image_url: '/images/blog/career-tips.svg',
    author: 'Career Coach',
    tags: ['Career', 'Tips', 'Freelancing'],
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    is_published: true,
    is_news_trend: false,
    views: 2100,
    reading_time: 8
  },
  {
    id: '4',
    title: 'Smart Matching: How Our Algorithm Finds Your Perfect Project',
    slug: 'smart-matching-algorithm',
    excerpt: 'A deep dive into the 7-factor AI algorithm that powers MegiLance\'s intelligent project-freelancer matching.',
    content: `<p>Our proprietary matching algorithm considers multiple factors to ensure the best possible matches between freelancers and projects.</p>
      <h2>The 7 Matching Factors</h2>
      <ol>
        <li><strong>Skill Alignment:</strong> We analyze your stated skills and infer additional capabilities from your work history.</li>
        <li><strong>Experience Level:</strong> Projects are matched to freelancers with appropriate experience for the complexity involved.</li>
        <li><strong>Availability:</strong> Real-time workload tracking ensures you only see projects you can actually take on.</li>
        <li><strong>Budget Match:</strong> We align client budgets with freelancer rate expectations to avoid negotiation friction.</li>
        <li><strong>Work Style:</strong> Communication preferences, timezone compatibility, and collaboration styles are factored in.</li>
        <li><strong>Past Performance:</strong> Your track record on similar projects influences match quality scores.</li>
        <li><strong>Client Preferences:</strong> Some clients have specific requirements that we respect in our matching.</li>
      </ol>`,
    image_url: '/images/blog/algorithm.svg',
    author: 'Tech Lead',
    tags: ['AI', 'Algorithm', 'Technology'],
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString(),
    is_published: true,
    is_news_trend: true,
    views: 1560,
    reading_time: 6
  },
  {
    id: '5',
    title: 'Client Success Story: Building a Global Remote Team',
    slug: 'client-success-story-remote-team',
    excerpt: 'How one startup scaled from 2 to 50 remote workers using MegiLance\'s talent platform.',
    content: `<p>When TechStartup Inc. first joined MegiLance, they were a two-person team with big ambitions. Within 18 months, they had scaled to 50 remote workers across 12 countries.</p>
      <h2>The Challenge</h2>
      <p>Finding qualified remote talent was time-consuming and risky. Traditional hiring took weeks, and contract workers often didn't meet expectations.</p>
      <h2>The Solution</h2>
      <p>MegiLance's AI matching and vetting process reduced time-to-hire from 3 weeks to 3 days. The escrow system ensured quality while protecting both parties.</p>
      <h2>The Results</h2>
      <ul>
        <li>50+ team members hired successfully</li>
        <li>90% retention rate after 12 months</li>
        <li>40% cost savings compared to traditional agencies</li>
        <li>Projects delivered 25% faster on average</li>
      </ul>`,
    image_url: '/images/blog/success-story.svg',
    author: 'Community Manager',
    tags: ['Success Stories', 'Remote Work', 'Teams'],
    created_at: new Date(Date.now() - 345600000).toISOString(),
    updated_at: new Date(Date.now() - 345600000).toISOString(),
    is_published: true,
    is_news_trend: false,
    views: 980,
    reading_time: 4
  },
  {
    id: '6',
    title: 'Escrow Payments: Protecting Both Clients and Freelancers',
    slug: 'escrow-payments-protection',
    excerpt: 'Understanding how our secure escrow system ensures fair payments and builds trust between parties.',
    content: `<p>Trust is the foundation of any successful freelancing relationship. Our escrow system provides security for everyone involved.</p>
      <h2>How Escrow Works</h2>
      <p>When a project is agreed upon, the client funds the escrow. These funds are held securely until milestones are completed and approved. Only then are they released to the freelancer.</p>
      <h2>Benefits for Clients</h2>
      <ul>
        <li>Pay only for approved work</li>
        <li>Clear milestone tracking</li>
        <li>Dispute resolution support</li>
        <li>Refund protection for undelivered work</li>
      </ul>
      <h2>Benefits for Freelancers</h2>
      <ul>
        <li>Guaranteed payment for approved work</li>
        <li>No more chasing invoices</li>
        <li>Protection from scope creep</li>
        <li>Professional dispute mediation</li>
      </ul>`,
    image_url: '/images/blog/escrow.svg',
    author: 'Product Team',
    tags: ['Security', 'Payments', 'Trust'],
    created_at: new Date(Date.now() - 432000000).toISOString(),
    updated_at: new Date(Date.now() - 432000000).toISOString(),
    is_published: true,
    is_news_trend: false,
    views: 750,
    reading_time: 5
  }
];

export interface CreateBlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url?: string;
  author: string;
  tags: string[];
  is_published: boolean;
  is_news_trend: boolean;
}

export interface UpdateBlogPost {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  image_url?: string;
  author?: string;
  tags?: string[];
  is_published?: boolean;
  is_news_trend?: boolean;
}

export const blogApi = {
  getAll: async (isPublished?: boolean, isNewsTrend?: boolean): Promise<BlogPost[]> => {
    const params = new URLSearchParams();
    if (isPublished !== undefined) params.append('is_published', String(isPublished));
    if (isNewsTrend !== undefined) params.append('is_news_trend', String(isNewsTrend));
    
    try {
      const res = await fetch(`${API_URL}/blog?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      if (data && data.length > 0) return data;
      // Return demo posts if API returns empty
      return demoPosts;
    } catch (error) {
      // Return demo posts as fallback
      return demoPosts;
    }
  },

  getBySlug: async (slug: string): Promise<BlogPost | null> => {
    try {
      const res = await fetch(`${API_URL}/blog/${slug}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data) return data;
      }
    } catch (error) {
      // Fall through to demo posts
    }
    // Fallback to demo posts
    const demoPost = demoPosts.find(post => post.slug === slug);
    return demoPost || null;
  },

  create: async (post: CreateBlogPost): Promise<BlogPost> => {
    const res = await fetch(`${API_URL}/blog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    });
    if (!res.ok) throw new Error('Failed to create post');
    return res.json();
  },

  update: async (id: string, post: UpdateBlogPost): Promise<BlogPost> => {
    const res = await fetch(`${API_URL}/blog/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    });
    if (!res.ok) throw new Error('Failed to update post');
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/blog/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete post');
  },
};
