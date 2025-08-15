// @AI-HINT: A reusable card for displaying user testimonials, featuring a clean layout, avatar, and quote icon for a premium feel.

'use client';

import React, { useRef } from 'react';
import { useTheme } from 'next-themes';
import { Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import StarRating from '@/app/components/StarRating/StarRating';

import commonStyles from './TestimonialCard.base.module.css';
import lightStyles from './TestimonialCard.light.module.css';
import darkStyles from './TestimonialCard.dark.module.css';

export interface Testimonial {
  quote: string;
  author: string;
  title: string;
  avatarUrl: string;
  rating: number;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial }) => {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={cn(
        commonStyles.testimonialCard,
        themeStyles.testimonialCard,
        isVisible ? commonStyles.isVisible : commonStyles.isNotVisible
      )}
    >
      <div className={commonStyles.cardHeader}>
        <StarRating rating={testimonial.rating} />
        <Quote className={cn(commonStyles.quoteIcon, themeStyles.quoteIcon)} />
      </div>
      <blockquote className={cn(commonStyles.quote, themeStyles.quote)}>
        {testimonial.quote}
      </blockquote>
      <div className={commonStyles.authorInfo}>
        <UserAvatar src={testimonial.avatarUrl} name={testimonial.author} size={44} />
        <div className={commonStyles.authorDetails}>
          <p className={cn(commonStyles.authorName, themeStyles.authorName)}>{testimonial.author}</p>
          <p className={cn(commonStyles.authorTitle, themeStyles.authorTitle)}>{testimonial.title}</p>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
