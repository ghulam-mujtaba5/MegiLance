// @AI-HINT: This is the main page for the blog, which displays a grid of recent articles with theme support and animations.
'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

import BlogPostCard from '@/app/components/Public/BlogPostCard/BlogPostCard';
import { cn } from '@/lib/utils';
import { blogApi, BlogPost } from '@/lib/api/blog';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';

import commonStyles from './Blog.common.module.css';
import lightStyles from './Blog.light.module.css';
import darkStyles from './Blog.dark.module.css';

// Demo blog posts for fallback when API is unavailable
const demoPosts: BlogPost[] = [
  {
    id: '1',
    title: 'The Future of AI-Powered Freelancing',
    slug: 'future-ai-powered-freelancing',
    excerpt: 'Discover how artificial intelligence is revolutionizing the way freelancers find work and how businesses connect with top talent.',
    content: 'AI is transforming the freelancing landscape...',
    image_url: '/images/blog/ai-future.jpg',
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
    content: 'Traditional payment processors charge hefty fees...',
    image_url: '/images/blog/blockchain.jpg',
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
    content: 'The freelance economy continues to grow...',
    image_url: '/images/blog/career-tips.jpg',
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
    content: 'Our proprietary matching algorithm considers...',
    image_url: '/images/blog/algorithm.jpg',
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
    content: 'When TechStartup Inc. first joined MegiLance...',
    image_url: '/images/blog/success-story.jpg',
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
    content: 'Trust is the foundation of any successful...',
    image_url: '/images/blog/escrow.jpg',
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

const BlogPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUsingDemo, setIsUsingDemo] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await blogApi.getAll(true); // Fetch published posts
        if (data && data.length > 0) {
          setPosts(data);
        } else {
          // Use demo posts if API returns empty
          setPosts(demoPosts);
          setIsUsingDemo(true);
        }
      } catch (error) {
        console.error('Failed to fetch posts, using demo content:', error);
        // Use demo posts as fallback
        setPosts(demoPosts);
        setIsUsingDemo(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
         <AnimatedOrb variant="purple" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
         <AnimatedOrb variant="blue" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
         <ParticlesSystem count={12} className="absolute inset-0" />
         <div className="absolute top-20 left-10 opacity-10 animate-float-slow">
           <FloatingCube size={40} />
         </div>
         <div className="absolute bottom-40 right-20 opacity-10 animate-float-medium">
           <FloatingSphere size={30} variant="gradient" />
         </div>
      </div>

      <main id="main-content" role="main" aria-labelledby="blog-title" className={commonStyles.container}>
        <ScrollReveal>
          <header className={commonStyles.header}>
            <h1 id="blog-title" className={cn(commonStyles.title, themeStyles.title)}>The MegiLance Blog</h1>
            <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
              Insights on crypto, freelancing, and the future of work.
            </p>
            {isUsingDemo && (
              <p className={cn(commonStyles.demoNotice, themeStyles.subtitle)} style={{ fontSize: '0.875rem', marginTop: '0.5rem', opacity: 0.7 }}>
                📝 Showing demo articles • Connect MongoDB for live content
              </p>
            )}
          </header>
        </ScrollReveal>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <StaggerContainer className={commonStyles.grid} aria-label="Recent posts">
            {posts.map((post) => (
              <StaggerItem key={post.slug}>
                <BlogPostCard 
                  slug={post.slug}
                  title={post.title}
                  excerpt={post.excerpt}
                  imageUrl={post.image_url || '/images/blog/productivity.jpg'}
                  author={post.author}
                  date={new Date(post.created_at).toLocaleDateString()}
                  content={post.content}
                  views={post.views}
                  readingTime={post.reading_time}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </main>
    </PageTransition>
  );
};

export default BlogPage;

