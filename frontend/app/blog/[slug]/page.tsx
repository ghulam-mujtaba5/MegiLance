// @AI-HINT: This page displays an individual blog post with theme support and animations, fetching data from a centralized source.
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from 'next-themes';

import { mockPosts } from '../data';
import { PageTransition, ScrollReveal } from '@/components/Animations';
import { cn } from '@/lib/utils';

import commonStyles from './BlogPost.common.module.css';
import lightStyles from './BlogPost.light.module.css';
import darkStyles from './BlogPost.dark.module.css';

const BlogPostPage: React.FC = () => {
  const params = useParams();
  const slug = params.slug as string;
  const post = mockPosts.find((p) => p.slug === slug);

  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  if (!post) {
    return (
      <main id="main-content" role="main" className={commonStyles.container}>
        <p role="status" aria-live="polite">Post not found.</p>
      </main>
    );
  }

  return (
    <PageTransition>
      <main id="main-content" role="main" aria-labelledby="post-title">
        <div className={commonStyles.container}>
          <ScrollReveal>
            <article className={commonStyles.article}>
              <header className={commonStyles.header}>
                <h1 id="post-title" className={cn(commonStyles.title, themeStyles.title)}>{post.title}</h1>
                <div className={cn(commonStyles.meta, themeStyles.meta)}>
                  <span className={commonStyles.author}>By {post.author}</span>
                  <span>{post.date}</span>
                </div>
              </header>

              <figure className={commonStyles.imageWrapper}>
                <Image src={post.imageUrl} alt={post.title} layout="fill" objectFit="cover" />
              </figure>

              <section
                aria-label="Post content"
                className={cn(commonStyles.content, themeStyles.content)}
                dangerouslySetInnerHTML={{ __html: post.content || '' }}
              />
            </article>
          </ScrollReveal>
        </div>
      </main>
    </PageTransition>
  );
};


export default BlogPostPage;
