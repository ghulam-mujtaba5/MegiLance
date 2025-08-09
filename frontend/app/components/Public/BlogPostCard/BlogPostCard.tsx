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
   * The full HTML content of the blog post.
   */
  content?: string;
  /**
   * Optional CSS class to apply to the component.
   */
  className?: string;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ slug, title, excerpt, imageUrl, author, date, className }) => {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

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
        </div>
      </div>
    </Link>
  );
};

export default BlogPostCard;
