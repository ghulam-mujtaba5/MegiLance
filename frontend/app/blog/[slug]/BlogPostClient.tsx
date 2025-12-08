// @AI-HINT: This page displays an individual blog post with theme support and animations, fetching data from a centralized source.
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from 'next-themes';

import { blogApi, BlogPost } from '@/lib/api/blog';
import { PageTransition, ScrollReveal } from '@/components/Animations';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import { cn } from '@/lib/utils';

import commonStyles from './BlogPost.common.module.css';
import lightStyles from './BlogPost.light.module.css';
import darkStyles from './BlogPost.dark.module.css';

const BlogPostClient: React.FC = () => {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await blogApi.getBySlug(slug);
        setPost(data);
      } catch (error) {
        console.error('Failed to fetch post:', error);
      } finally {
        setLoading(false);
      }
    };
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  if (loading) {
    return (
      <main id="main-content" role="main" className={commonStyles.container}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </main>
    );
  }

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
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  {post.views !== undefined && (
                    <span className="flex items-center gap-1 ml-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      {post.views} views
                    </span>
                  )}
                  {post.reading_time !== undefined && (
                    <span className="flex items-center gap-1 ml-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {post.reading_time} min read
                    </span>
                  )}
                </div>
              </header>

              <figure className={commonStyles.imageWrapper}>
                <Image src={post.image_url || '/images/blog/productivity.jpg'} alt={post.title} layout="fill" objectFit="cover" />
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


export default BlogPostClient;
