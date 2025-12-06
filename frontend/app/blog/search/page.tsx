// @AI-HINT: Blog search page filtering mock posts client-side with 3D design system.
'use client';

import React, { useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { mockPosts } from '../data';
import BlogPostCard from '@/app/components/Public/BlogPostCard/BlogPostCard';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { Search } from 'lucide-react';

import commonStyles from './BlogSearch.common.module.css';
import lightStyles from './BlogSearch.light.module.css';
import darkStyles from './BlogSearch.dark.module.css';

export default function BlogSearchPage() {
  const { resolvedTheme } = useTheme();
  const [q, setQ] = useState('');
  
  const posts = useMemo(() => 
    mockPosts.filter(p => 
      !q || 
      p.title.toLowerCase().includes(q.toLowerCase()) || 
      p.excerpt.toLowerCase().includes(q.toLowerCase())
    ), 
  [q]);

  if (!resolvedTheme) return null;

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <PageTransition>
      <main className={cn(commonStyles.page, themeStyles.page)}>
        <div className={commonStyles.container}>
          <ScrollReveal>
            <header className={commonStyles.header}>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Search Blog</h1>
            </header>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className={commonStyles.searchContainer}>
              <Search className={cn(commonStyles.searchIcon, themeStyles.searchIcon)} size={20} />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search posts..."
                className={cn(commonStyles.searchInput, themeStyles.searchInput)}
                aria-label="Search blog posts"
              />
            </div>
          </ScrollReveal>

          <div className={commonStyles.grid}>
            {posts.map((p, index) => (
              <ScrollReveal key={p.slug} delay={0.1 + index * 0.05}>
                <BlogPostCard {...p} />
              </ScrollReveal>
            ))}
          </div>

          {posts.length === 0 && (
            <ScrollReveal>
              <p className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                No posts found matching "{q}".
              </p>
            </ScrollReveal>
          )}
        </div>
      </main>
    </PageTransition>
  );
}