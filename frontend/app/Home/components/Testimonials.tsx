// @AI-HINT: Testimonials section with dynamic fade-in animations and improved semantics.
'use client';

import React, { useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import commonStyles from './Testimonials.common.module.css';
import lightStyles from './Testimonials.light.module.css';
import darkStyles from './Testimonials.dark.module.css';

// --- Data (moved outside component for performance) ---
const testimonialsData = [
  {
    quote: 'MegiLance has revolutionized the way I work. The AI tools are a game-changer, and the secure payment system gives me peace of mind.',
    author: 'Alexia C.',
    title: 'Senior Frontend Developer',
    avatar: '/avatars/alexia.jpg',
  },
  {
    quote: 'As a client, finding top talent has never been easier. The platform is intuitive, and the quality of freelancers is outstanding.',
    author: 'John D.',
    title: 'Startup Founder',
    avatar: '/avatars/john.jpg',
  },
  {
    quote: 'The instant USDC payments are incredible. No more waiting for bank transfers or dealing with high fees. This is the future!',
    author: 'Maria S.',
    title: 'UX/UI Designer',
    avatar: '/avatars/maria.jpg',
  },
];

// --- Subcomponent for a single testimonial card ---
const TestimonialCard: React.FC<{ testimonial: typeof testimonialsData[0], themeStyles: any }> = ({ testimonial, themeStyles }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.2 });
  const [avatarSrc, setAvatarSrc] = useState<string>(testimonial.avatar);

  return (
    <div 
      ref={ref} 
      className={cn(
        commonStyles.testimonialCard,
        themeStyles.testimonialCard,
        isVisible ? commonStyles.isVisible : commonStyles.isNotVisible
      )}
    >
      <blockquote className={cn(commonStyles.testimonialQuote, themeStyles.testimonialQuote)}>
        {testimonial.quote}
      </blockquote>
      <div className={commonStyles.testimonialAuthor}>
        <Image 
          src={avatarSrc} 
          alt={`Avatar of ${testimonial.author}`}
          className={commonStyles.authorAvatar} 
          width={48} 
          height={48} 
          sizes="48px"
          onError={() => setAvatarSrc('/mock-avatar.png')}
        />
        <div className={commonStyles.authorInfo}>
          <p className={cn(commonStyles.authorName, themeStyles.authorName)}>{testimonial.author}</p>
          <p className={cn(commonStyles.authorTitle, themeStyles.authorTitle)}>{testimonial.title}</p>
        </div>
      </div>
    </div>
  );
};

// --- Main Testimonials Component ---
const Testimonials: React.FC = () => {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <section className={cn(commonStyles.testimonials, themeStyles.testimonials)}>
      <div className={commonStyles.container}>
        <h2 className={commonStyles.sectionTitle}>Loved by Freelancers & Clients</h2>
        <div className={commonStyles.testimonialsGrid}>
          {testimonialsData.map((testimonial) => (
            <TestimonialCard key={testimonial.author} testimonial={testimonial} themeStyles={themeStyles} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
