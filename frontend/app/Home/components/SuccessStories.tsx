// @AI-HINT: Success Stories section showcasing real freelancer achievements and platform statistics. Replaces video-based ProductScreenshots section.

'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ChevronLeft, 
  ChevronRight,
  Star,
  MapPin,
  Briefcase,
  Award
} from 'lucide-react';
import Image from 'next/image';

import commonStyles from './SuccessStories.common.module.css';
import lightStyles from './SuccessStories.light.module.css';
import darkStyles from './SuccessStories.dark.module.css';

// --- Type Definitions ---
interface SuccessStory {
  id: number;
  name: string;
  role: string;
  location: string;
  avatar: string;
  quote: string;
  achievement: string;
  earnings: string;
  projectsCompleted: number;
  rating: number;
}

interface PlatformStat {
  icon: React.ReactNode;
  value: string;
  label: string;
  suffix?: string;
}

// --- Data ---
const successStories: SuccessStory[] = [
  {
    id: 1,
    name: 'Sofia Martinez',
    role: 'Full-Stack Developer',
    location: 'Lahore, Pakistan',
    avatar: '/images/freelancers/sofia.jpg',
    quote: 'MegiLance transformed my freelance career. The AI matching connected me with clients who truly value my skills, and blockchain payments give me peace of mind.',
    achievement: 'Top Rated Plus in 6 months',
    earnings: '$45,000+',
    projectsCompleted: 48,
    rating: 5.0,
  },
  {
    id: 2,
    name: 'Daniel Chen',
    role: 'UI/UX Designer',
    location: 'Karachi, Pakistan',
    avatar: '/images/freelancers/daniel.jpg',
    quote: 'The secure escrow system and instant USDC payments have eliminated all my payment concerns. I can focus entirely on delivering exceptional designs.',
    achievement: 'Rising Talent of the Year',
    earnings: '$32,000+',
    projectsCompleted: 67,
    rating: 4.9,
  },
  {
    id: 3,
    name: 'Hannah Lee',
    role: 'Data Scientist',
    location: 'Islamabad, Pakistan',
    avatar: '/images/freelancers/hannah.jpg',
    quote: 'The AI-powered job recommendations are incredibly accurate. I spend less time searching and more time doing what I love - solving complex data problems.',
    achievement: 'Expert-Vetted Badge Holder',
    earnings: '$58,000+',
    projectsCompleted: 35,
    rating: 5.0,
  },
  {
    id: 4,
    name: 'Ethan Brooks',
    role: 'Mobile App Developer',
    location: 'Faisalabad, Pakistan',
    avatar: '/images/freelancers/ethan.jpg',
    quote: 'From my first project to becoming a top-rated developer, MegiLance has been the perfect platform. The community and support are unmatched.',
    achievement: '100% Job Success Score',
    earnings: '$72,000+',
    projectsCompleted: 89,
    rating: 5.0,
  },
];

const platformStats: PlatformStat[] = [
  {
    icon: <Users size={24} />,
    value: '50K',
    label: 'Active Freelancers',
    suffix: '+',
  },
  {
    icon: <Briefcase size={24} />,
    value: '25K',
    label: 'Projects Completed',
    suffix: '+',
  },
  {
    icon: <DollarSign size={24} />,
    value: '$12M',
    label: 'Total Earnings Paid',
    suffix: '+',
  },
  {
    icon: <Trophy size={24} />,
    value: '98',
    label: 'Client Satisfaction',
    suffix: '%',
  },
];

// --- Sub-Components ---
const StoryCard: React.FC<{ story: SuccessStory; isActive: boolean; themeStyles: typeof lightStyles }> = ({
  story,
  isActive,
  themeStyles,
}) => {
  return (
    <div
      className={cn(
        commonStyles.storyCard,
        themeStyles.storyCard,
        isActive && commonStyles.storyCardActive,
        isActive && themeStyles.storyCardActive
      )}
    >
      {/* Quote */}
      <blockquote className={cn(commonStyles.quote, themeStyles.quote)}>
        <span className={cn(commonStyles.quoteMark, themeStyles.quoteMark)}>"</span>
        {story.quote}
      </blockquote>

      {/* Author Info */}
      <div className={commonStyles.authorSection}>
        <div className={commonStyles.avatarWrapper}>
          <Image
            src={story.avatar}
            alt={`${story.name}'s profile`}
            width={64}
            height={64}
            className={cn(commonStyles.avatar, themeStyles.avatar)}
          />
          <div className={cn(commonStyles.ratingBadge, themeStyles.ratingBadge)}>
            <Star size={12} fill="currentColor" />
            <span>{story.rating}</span>
          </div>
        </div>

        <div className={commonStyles.authorDetails}>
          <h4 className={cn(commonStyles.authorName, themeStyles.authorName)}>{story.name}</h4>
          <p className={cn(commonStyles.authorRole, themeStyles.authorRole)}>{story.role}</p>
          <div className={cn(commonStyles.authorLocation, themeStyles.authorLocation)}>
            <MapPin size={14} />
            <span>{story.location}</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className={cn(commonStyles.statsRow, themeStyles.statsRow)}>
        <div className={commonStyles.statItem}>
          <DollarSign size={16} />
          <span className={commonStyles.statValue}>{story.earnings}</span>
          <span className={commonStyles.statLabel}>Earned</span>
        </div>
        <div className={commonStyles.statItem}>
          <Briefcase size={16} />
          <span className={commonStyles.statValue}>{story.projectsCompleted}</span>
          <span className={commonStyles.statLabel}>Projects</span>
        </div>
        <div className={commonStyles.statItem}>
          <Award size={16} />
          <span className={cn(commonStyles.statValue, commonStyles.achievementText)}>{story.achievement}</span>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ stat: PlatformStat; themeStyles: typeof lightStyles }> = ({ stat, themeStyles }) => {
  return (
    <div className={cn(commonStyles.platformStat, themeStyles.platformStat)}>
      <div className={cn(commonStyles.statIcon, themeStyles.statIcon)}>{stat.icon}</div>
      <div className={commonStyles.statContent}>
        <span className={cn(commonStyles.statNumber, themeStyles.statNumber)}>
          {stat.value}
          {stat.suffix && <span className={commonStyles.statSuffix}>{stat.suffix}</span>}
        </span>
        <span className={cn(commonStyles.platformStatLabel, themeStyles.platformStatLabel)}>{stat.label}</span>
      </div>
    </div>
  );
};

// --- Main Component ---
const SuccessStories: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const [activeIndex, setActiveIndex] = useState(0);

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? successStories.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev === successStories.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className={cn(commonStyles.section, themeStyles.section)}>
      <div className={commonStyles.container}>
        {/* Section Header */}
        <div className={commonStyles.header}>
          <div className={cn(commonStyles.badge, themeStyles.badge)}>
            <Trophy size={16} />
            <span>Success Stories</span>
          </div>
          <h2 className={cn(commonStyles.title, themeStyles.title)}>
            Real Freelancers, <span className={commonStyles.highlight}>Real Success</span>
          </h2>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Join thousands of Pakistani freelancers who have transformed their careers with MegiLance's 
            AI-powered matching and secure blockchain payments.
          </p>
        </div>

        {/* Platform Statistics */}
        <div className={commonStyles.statsGrid}>
          {platformStats.map((stat, idx) => (
            <StatCard key={idx} stat={stat} themeStyles={themeStyles} />
          ))}
        </div>

        {/* Stories Carousel */}
        <div className={commonStyles.carouselContainer}>
          <button
            className={cn(commonStyles.navButton, commonStyles.navPrev, themeStyles.navButton)}
            onClick={goToPrevious}
            aria-label="Previous story"
          >
            <ChevronLeft size={24} />
          </button>

          <div className={commonStyles.carouselTrack}>
            {successStories.map((story, idx) => (
              <StoryCard
                key={story.id}
                story={story}
                isActive={idx === activeIndex}
                themeStyles={themeStyles}
              />
            ))}
          </div>

          <button
            className={cn(commonStyles.navButton, commonStyles.navNext, themeStyles.navButton)}
            onClick={goToNext}
            aria-label="Next story"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Carousel Indicators */}
        <div className={commonStyles.indicators}>
          {successStories.map((_, idx) => (
            <button
              key={idx}
              className={cn(
                commonStyles.indicator,
                themeStyles.indicator,
                idx === activeIndex && commonStyles.indicatorActive,
                idx === activeIndex && themeStyles.indicatorActive
              )}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Go to story ${idx + 1}`}
            />
          ))}
        </div>

        {/* CTA */}
        <div className={commonStyles.ctaSection}>
          <p className={cn(commonStyles.ctaText, themeStyles.ctaText)}>
            Ready to write your own success story?
          </p>
          <a href="/signup" className={cn(commonStyles.ctaButton, themeStyles.ctaButton)}>
            <TrendingUp size={18} />
            <span>Start Your Journey</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
