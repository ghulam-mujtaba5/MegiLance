// @AI-HINT: This is the main page for the blog, which displays a grid of recent articles with theme support and animations.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';

import BlogPostCard from '@/app/components/Public/BlogPostCard/BlogPostCard';
import { cn } from '@/lib/utils';
import { mockPosts } from './data';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';

import commonStyles from './Blog.common.module.css';
import lightStyles from './Blog.light.module.css';
import darkStyles from './Blog.dark.module.css';

const BlogPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <PageTransition>
      <main id="main-content" role="main" aria-labelledby="blog-title" className={commonStyles.container}>
        <ScrollReveal>
          <header className={commonStyles.header}>
            <h1 id="blog-title" className={cn(commonStyles.title, themeStyles.title)}>The MegiLance Blog</h1>
            <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
              Insights on crypto, freelancing, and the future of work.
            </p>
          </header>
        </ScrollReveal>

        <StaggerContainer className={commonStyles.grid} aria-label="Recent posts">
          {mockPosts.map((post) => (
            <StaggerItem key={post.slug}>
              <BlogPostCard {...post} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </main>
    </PageTransition>
  );
};

export default BlogPage;

