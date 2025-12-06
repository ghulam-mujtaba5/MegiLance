// @AI-HINT: This page displays an individual blog post with theme support and animations, fetching data from a centralized source.
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from 'next-themes';

import { mockPosts } from '../data';
import { PageTransition, ScrollReveal } from '@/components/Animations';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
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
