// @AI-HINT: This component displays a theme-aware preview card for a blog post. It relies on global CSS variables for theming, ensuring a consistent look and feel with the rest of the application.
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';

import { cn } from '@/lib/utils';
import commonStyles from './BlogPostCard.common.module.css';
import lightStyles from './BlogPostCard.light.module.css';
import darkStyles from './BlogPostCard.dark.module.css';



export interface BlogPostCardProps {
  /**
   * Unique identifier for the blog post.
   */
  slug: string;
  /**
   * Title of the blog post.
   */
  title: string;
  /**
   * Brief summary of the blog post.
   */
  excerpt: string;
  /**
   * URL of the image to display.
   */
  imageUrl: string;
  /**
   * Author of the blog post.
   */
  author: string;
  /**
   * Date the blog post was published.
   */
  date: string;
  /**
   * Number of views.
   */
  views?: number;
  /**
   * Estimated reading time in minutes.
   */
  readingTime?: number;
  /**
   * The full HTML content of the blog post.
   */
  content?: string;
  /**
   * Optional CSS class to apply to the component.
   */
  className?: string;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ slug, title, excerpt, imageUrl, author, date, views, readingTime, className }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <Link href={`/blog/${slug}`} className={cn(commonStyles.blogPostCardLink, className)}>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={commonStyles.imageWrapper}>
          <Image src={imageUrl} alt={title} layout="fill" objectFit="cover" />
        </div>
        <div className={commonStyles.content}>
          <h3 className={cn(commonStyles.title, themeStyles.title)}>{title}</h3>
          <p className={cn(commonStyles.excerpt, themeStyles.excerpt)}>{excerpt}</p>
          <div className={cn(commonStyles.meta, themeStyles.meta)}>
            <span className={commonStyles.author}>By {author}</span>
            <span className={commonStyles.date}>{date}</span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
             {views !== undefined && (
               <span className="flex items-center gap-1">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                 {views} views
               </span>
             )}
             {readingTime !== undefined && (
               <span className="flex items-center gap-1">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                 {readingTime} min read
               </span>
             )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BlogPostCard;
