// @AI-HINT: Public user profile - portfolio showcase, reviews, contact. Fully theme-aware with CSS modules.
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import {
  Star, MapPin, Clock, CheckCircle, DollarSign,
  Linkedin, Github, Globe, Mail, Phone,
  Calendar, Award, ThumbsUp, MessageCircle
} from 'lucide-react';
import Button from '@/app/components/Button/Button';
import StarRating from '@/app/components/StarRating/StarRating';
import Loading from '@/app/components/Loading/Loading';
import Image from 'next/image';

import commonStyles from './UserProfile.common.module.css';
import lightStyles from './UserProfile.light.module.css';
import darkStyles from './UserProfile.dark.module.css';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  projectUrl?: string;
  tags: string[];
  completedAt: string;
}

interface Review {
  id: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  projectTitle: string;
  createdAt: string;
  criteria: {
    quality: number;
    communication: number;
    timeliness: number;
    professionalism: number;
  };
}

interface UserProfileProps {
  userId: string | number;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<PortfolioItem | null>(null);

  if (!resolvedTheme) return null;

  const themed = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    loadProfile();
    loadPortfolio();
    loadReviews();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const data = await (api.users as any).get?.(userId);
      setProfile({
        ...data,
        avatarUrl: data.profile_image_url,
        hourlyRate: data.hourly_rate,
        joinedAt: data.joined_at,
        title: data.title || data.user_type || 'Freelancer',
        skills: Array.isArray(data.skills) ? data.skills : (data.skills ? [data.skills] : []),
        linkedinUrl: data.linkedin_url,
        githubUrl: data.github_url,
        websiteUrl: data.website_url,
        phone: data.phone_number,
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPortfolio = async () => {
    try {
      const data = await (api.portfolio as any).list?.(userId);
      const mappedPortfolio = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl: item.image_url || '/placeholder-project.jpg',
        projectUrl: item.project_url,
        tags: item.tags || [],
        completedAt: item.created_at,
      }));
      setPortfolio(mappedPortfolio);
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await (api.reviews as any).list?.({ user_id: Number(userId) });
      const mappedReviews = (data as any[]).map((item: any) => ({
        id: item.id,
        reviewerName: item.reviewer_name || 'Anonymous',
        reviewerAvatar: '/default-avatar.png',
        rating: item.rating,
        comment: item.review_text,
        projectTitle: item.project_title || 'Project',
        createdAt: item.created_at,
        criteria: {
          quality: item.quality_rating || 0,
          communication: item.communication_rating || 0,
          timeliness: item.deadline_rating || 0,
          professionalism: item.professionalism_rating || 0,
        },
      }));
      setReviews(mappedReviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themed.container)}>
        <Loading size="lg" text="Loading profile..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={cn(commonStyles.container, themed.container)}>
        <div className={commonStyles.emptyState} role="alert">
          <p className={cn(commonStyles.emptyText, themed.emptyText)}>
            Profile not found
          </p>
        </div>
      </div>
    );
  }

  const avgRating = calculateAverageRating();

  return (
    <div className={cn(commonStyles.container, themed.container)}>
      {/* Profile Header */}
      <header className={cn(commonStyles.header, themed.header)}>
        <div className={commonStyles.avatar}>
          <Image
            src={profile.avatarUrl || '/default-avatar.png'}
            alt={`${profile.name}'s profile photo`}
            width={120}
            height={120}
            className={commonStyles.avatarImage}
          />
          {profile.verified && (
            <div
              className={cn(commonStyles.verifiedBadge, themed.verifiedBadge)}
              aria-label="Verified user"
            >
              <CheckCircle size={16} aria-hidden="true" />
            </div>
          )}
        </div>

        <div className={cn(commonStyles.nameSection, themed.nameSection)}>
          <div className={commonStyles.nameRow}>
            <h1 className={cn(commonStyles.title, themed.title)}>
              {profile.name}
            </h1>
            {profile.topRated && (
              <span className={cn(commonStyles.badge, themed.badge)}>
                <Award size={14} aria-hidden="true" />
                Top Rated
              </span>
            )}
          </div>
          <p className={cn(commonStyles.subtitle, themed.subtitle)}>
            {profile.title}
          </p>

          <div className={commonStyles.metaRow}>
            {profile.location && (
              <div className={cn(commonStyles.metaItem, themed.metaItem)}>
                <MapPin size={14} aria-hidden="true" />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.timezone && (
              <div className={cn(commonStyles.metaItem, themed.metaItem)}>
                <Clock size={14} aria-hidden="true" />
                <span>{profile.timezone}</span>
              </div>
            )}
            {profile.hourlyRate && (
              <div className={cn(commonStyles.metaItem, themed.metaItem)}>
                <DollarSign size={14} aria-hidden="true" />
                <span>${profile.hourlyRate}/hr</span>
              </div>
            )}
          </div>

          <div className={cn(commonStyles.stats, themed.stats)}>
            <div className={cn(commonStyles.statItem, themed.statItem)}>
              <StarRating rating={avgRating} showValue reviewCount={reviews.length} />
            </div>
            <div className={cn(commonStyles.statItem, themed.statItem)}>
              <ThumbsUp size={14} aria-hidden="true" />
              <span>{profile.projectsCompleted || 0} projects completed</span>
            </div>
            <div className={cn(commonStyles.statItem, themed.statItem)}>
              <Calendar size={14} aria-hidden="true" />
              <span>Joined {new Date(profile.joinedAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className={cn(commonStyles.availability, themed.availability)}>
            <Clock size={14} aria-hidden="true" />
            <span>
              {profile.availability === 'immediate'
                ? 'Available Now'
                : profile.availability === 'within-week'
                  ? 'Available Within a Week'
                  : 'Available Within a Month'}
            </span>
          </div>
        </div>

        <div className={cn(commonStyles.actions, themed.actions)}>
          <Button variant="primary" size="lg" aria-label={`Contact ${profile.name}`}>
            <Mail size={16} aria-hidden="true" />
            Contact
          </Button>
          <Button variant="secondary" size="lg" aria-label={`Hire ${profile.name}`}>
            Hire Now
          </Button>
        </div>
      </header>

      {/* About Section */}
      {profile.bio && (
        <section className={cn(commonStyles.section, themed.section)} aria-labelledby="about-heading">
          <h2 id="about-heading" className={cn(commonStyles.sectionTitle, themed.sectionTitle)}>
            About
          </h2>
          <p className={cn(commonStyles.aboutText, themed.aboutText)}>
            {profile.bio}
          </p>
        </section>
      )}

      {/* Skills Section */}
      {profile.skills?.length > 0 && (
        <section className={cn(commonStyles.section, themed.section)} aria-labelledby="skills-heading">
          <h2 id="skills-heading" className={cn(commonStyles.sectionTitle, themed.sectionTitle)}>
            Skills
          </h2>
          <div className={cn(commonStyles.skillsGrid, themed.skillsGrid)}>
            {profile.skills.map((skill: string, index: number) => (
              <span key={index} className={cn(commonStyles.skillTag, themed.skillTag)}>
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Portfolio Section */}
      {portfolio.length > 0 && (
        <section className={cn(commonStyles.section, themed.section)} aria-labelledby="portfolio-heading">
          <h2 id="portfolio-heading" className={cn(commonStyles.sectionTitle, themed.sectionTitle)}>
            Portfolio ({portfolio.length})
          </h2>
          <div className={cn(commonStyles.portfolioGrid, themed.portfolioGrid)}>
            {portfolio.map((item) => (
              <button
                key={item.id}
                className={cn(commonStyles.portfolioCard, themed.portfolioCard)}
                onClick={() => setSelectedPortfolioItem(item)}
                aria-label={`View portfolio item: ${item.title}`}
                type="button"
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  width={400}
                  height={300}
                  className={commonStyles.portfolioImage}
                />
                <div className={commonStyles.portfolioContent}>
                  <h3 className={cn(commonStyles.portfolioTitle, themed.portfolioTitle)}>
                    {item.title}
                  </h3>
                  <p className={cn(commonStyles.portfolioDesc, themed.portfolioDesc)}>
                    {item.description}
                  </p>
                  <div className={commonStyles.portfolioTags}>
                    {item.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={cn(commonStyles.portfolioTag, themed.portfolioTag)}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <section className={cn(commonStyles.section, themed.section)} aria-labelledby="reviews-heading">
          <h2 id="reviews-heading" className={cn(commonStyles.sectionTitle, themed.sectionTitle)}>
            Reviews & Ratings ({reviews.length})
          </h2>
          {reviews.map((review) => (
            <article
              key={review.id}
              className={cn(commonStyles.reviewCard, themed.reviewCard)}
              aria-label={`Review by ${review.reviewerName}`}
            >
              <div className={commonStyles.reviewHeader}>
                <Image
                  src={review.reviewerAvatar}
                  alt={`${review.reviewerName}'s avatar`}
                  width={50}
                  height={50}
                  className={commonStyles.reviewerAvatar}
                />
                <div className={commonStyles.reviewMeta}>
                  <div className={commonStyles.reviewMetaTop}>
                    <div>
                      <p className={cn(commonStyles.reviewerName, themed.reviewerName)}>
                        {review.reviewerName}
                      </p>
                      <p className={cn(commonStyles.reviewProject, themed.reviewProject)}>
                        {review.projectTitle}
                      </p>
                    </div>
                    <div className={commonStyles.reviewRating}>
                      <StarRating rating={review.rating} size="sm" showValue />
                    </div>
                  </div>

                  <div className={cn(commonStyles.criteriaGrid, themed.criteriaGrid)}>
                    <div className={commonStyles.criteriaItem}>
                      <span className={cn(commonStyles.criteriaLabel, themed.criteriaLabel)}>
                        Quality
                      </span>
                      <StarRating rating={review.criteria.quality} size="sm" />
                    </div>
                    <div className={commonStyles.criteriaItem}>
                      <span className={cn(commonStyles.criteriaLabel, themed.criteriaLabel)}>
                        Communication
                      </span>
                      <StarRating rating={review.criteria.communication} size="sm" />
                    </div>
                    <div className={commonStyles.criteriaItem}>
                      <span className={cn(commonStyles.criteriaLabel, themed.criteriaLabel)}>
                        Timeliness
                      </span>
                      <StarRating rating={review.criteria.timeliness} size="sm" />
                    </div>
                    <div className={commonStyles.criteriaItem}>
                      <span className={cn(commonStyles.criteriaLabel, themed.criteriaLabel)}>
                        Professionalism
                      </span>
                      <StarRating rating={review.criteria.professionalism} size="sm" />
                    </div>
                  </div>

                  <p className={cn(commonStyles.reviewComment, themed.reviewComment)}>
                    {review.comment}
                  </p>
                  <time
                    className={cn(commonStyles.reviewDate, themed.reviewDate)}
                    dateTime={review.createdAt}
                  >
                    {new Date(review.createdAt).toLocaleDateString()}
                  </time>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Contact Section */}
      <section className={cn(commonStyles.section, themed.section)} aria-labelledby="contact-heading">
        <h2 id="contact-heading" className={cn(commonStyles.sectionTitle, themed.sectionTitle)}>
          Contact Information
        </h2>
        <div className={cn(commonStyles.contactInfo, themed.contactInfo)}>
          {profile.email && (
            <div className={cn(commonStyles.contactItem, themed.contactItem)}>
              <Mail size={16} aria-hidden="true" />
              <span>{profile.email}</span>
            </div>
          )}
          {profile.phone && (
            <div className={cn(commonStyles.contactItem, themed.contactItem)}>
              <Phone size={16} aria-hidden="true" />
              <span>{profile.phone}</span>
            </div>
          )}
        </div>

        <div className={cn(commonStyles.socialLinks, themed.socialLinks)}>
          {profile.linkedinUrl && (
            <a
              href={profile.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(commonStyles.socialLink, themed.socialLink)}
              aria-label="Visit LinkedIn profile"
            >
              <Linkedin size={16} aria-hidden="true" />
              LinkedIn
            </a>
          )}
          {profile.githubUrl && (
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(commonStyles.socialLink, themed.socialLink)}
              aria-label="Visit GitHub profile"
            >
              <Github size={16} aria-hidden="true" />
              GitHub
            </a>
          )}
          {profile.websiteUrl && (
            <a
              href={profile.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(commonStyles.socialLink, themed.socialLink)}
              aria-label="Visit personal website"
            >
              <Globe size={16} aria-hidden="true" />
              Website
            </a>
          )}
        </div>
      </section>
    </div>
  );
};

export default UserProfile;
