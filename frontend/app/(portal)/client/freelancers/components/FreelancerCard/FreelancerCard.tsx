// @AI-HINT: A data-rich, interactive card for displaying freelancer profiles.
'use client';

import React from 'react';
// Link not used; navigate via router on button click
import { cn } from '@/lib/utils';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import StarRating from '@/app/components/StarRating/StarRating';
import Badge from '@/app/components/Badge/Badge';
import Button from '@/app/components/Button/Button';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Briefcase, MapPin, DollarSign } from 'lucide-react';

import common from './FreelancerCard.base.module.css';
import light from './FreelancerCard.light.module.css';
import dark from './FreelancerCard.dark.module.css';

export interface Freelancer {
  id: string;
  name: string;
  avatarUrl?: string;
  title: string;
  rate: string;
  location: string;
  skills: string[];
  rating: number;
  availability: 'Full-time' | 'Part-time' | 'Contract';
}

interface FreelancerCardProps {
  freelancer: Freelancer;
}

const FreelancerCard: React.FC<FreelancerCardProps> = ({ freelancer }) => {
  const { theme } = useTheme();
  const router = useRouter();
  const themed = theme === 'dark' ? dark : light;

  return (
    <article className={cn(common.card, themed.card)}>
      <div className={common.cardHeader}>
        <UserAvatar src={freelancer.avatarUrl} name={freelancer.name} size={64} />
        <div className={common.headerText}>
          <h3 className={cn(common.name, themed.name)}>{freelancer.name}</h3>
          <p className={cn(common.title, themed.title)}>{freelancer.title}</p>
          <div className={cn(common.ratingContainer, themed.ratingContainer)}>
            <StarRating rating={freelancer.rating} />
            <span className={cn(common.ratingValue, themed.ratingValue)}>{freelancer.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className={common.cardBody}>
        <div className={cn(common.infoGrid, themed.infoGrid)}>
          <div className={common.infoItem}>
            <Briefcase size={16} className={cn(common.infoIcon, themed.infoIcon)} />
            <span className={cn(common.infoText, themed.infoText)}>{freelancer.availability}</span>
          </div>
          <div className={common.infoItem}>
            <MapPin size={16} className={cn(common.infoIcon, themed.infoIcon)} />
            <span className={cn(common.infoText, themed.infoText)}>{freelancer.location}</span>
          </div>
          <div className={common.infoItem}>
            <DollarSign size={16} className={cn(common.infoIcon, themed.infoIcon)} />
            <span className={cn(common.infoText, themed.infoText)}>{freelancer.rate}</span>
          </div>
        </div>

        <div className={common.skillsSection}>
          <h4 className={common.skillsTitle}>Top Skills</h4>
          <div className={common.skillsGrid}>
            {freelancer.skills.slice(0, 5).map(skill => (
              <Badge key={skill} variant="secondary">{skill}</Badge>
            ))}
          </div>
        </div>
      </div>

      <div className={common.cardFooter}>
        <Button
          variant="secondary"
          onClick={() => router.push(`/freelancers/${freelancer.id}`)}
          title="View freelancer profile"
        >
          View Profile
        </Button>
        <Button
          variant="primary"
          onClick={() => router.push(`/client/hire?freelancer=${freelancer.id}`)}
          title="Hire this freelancer"
        >
          Hire Now
        </Button>
      </div>
    </article>
  );
};

export default FreelancerCard;
