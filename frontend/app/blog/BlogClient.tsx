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

const BlogPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await blogApi.getAll(true); // Fetch published posts
        setPosts(data);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
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

