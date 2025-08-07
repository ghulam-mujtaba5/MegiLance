// @AI-HINT: Global impact section highlighting Pakistani talent and worldwide reach

'use client';

import React, { useRef } from 'react';
import { FaGlobe, FaFlag, FaUsers, FaChartLine, FaHeart, FaStar } from 'react-icons/fa';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useAnimatedCounter from '@/hooks/useAnimatedCounter';
import commonStyles from './GlobalImpact.common.module.css';
import lightStyles from './GlobalImpact.light.module.css';
import darkStyles from './GlobalImpact.dark.module.css';
import { IconType } from 'react-icons';

// --- Data (moved outside component for performance) ---
const impactStats = [
  { icon: FaUsers, number: "50,000+", label: "Pakistani Freelancers Empowered", description: "Breaking barriers and accessing global opportunities" },
  { icon: FaGlobe, number: "45+", label: "Countries Served", description: "Connecting talent across continents" },
  { icon: FaChartLine, number: "$269.8M", label: "Foreign Exchange Earned", description: "Contributing to Pakistan's digital economy" },
  { icon: FaStar, number: "4.9/5", label: "Average Project Rating", description: "Quality work that exceeds expectations" }
];

const successStories = [
  { name: "Ayesha Khan", role: "UI/UX Designer", city: "Karachi", achievement: "Earned $50K+ in first year", quote: "MegiLance opened doors to international clients I never thought possible." },
  { name: "Muhammad Ali", role: "Full-Stack Developer", city: "Lahore", achievement: "Built 200+ projects", quote: "The AI matching system finds me perfect projects every time." },
  { name: "Fatima Ahmed", role: "Content Writer", city: "Islamabad", achievement: "Top 1% performer", quote: "Instant USDC payments changed my life. No more banking delays." }
];

const mapLocations = [
    { name: 'Pakistan', style: commonStyles.mapDotPakistan },
    { name: 'USA', style: commonStyles.mapDotUsa },
    { name: 'UK', style: commonStyles.mapDotUk },
    { name: 'Australia', style: commonStyles.mapDotAustralia },
];

// --- Subcomponents for modularity and clarity ---

const AnimatedStatCard: React.FC<{ stat: typeof impactStats[0], themeStyles: any }> = ({ stat, themeStyles }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { number, icon: Icon, label, description } = stat;
  
  const match = number.match(/^([$]?)([\d,.]+)([KkMmBb]?\+?|\/5)?$/) || [];
  const prefix = match[1] || '';
  const targetValue = parseFloat((match[2] || '0').replace(/,/g, ''));
  const suffix = match[3] || '';
  const decimals = (match[2] || '').includes('.') ? (match[2] || '').split('.')[1].length : 0;

  const animatedValue = useAnimatedCounter(targetValue, 2000, decimals, ref);

  return (
    <div ref={ref} className={cn(commonStyles.stat, themeStyles.stat)}>
      <div className={cn(commonStyles.statIcon, themeStyles.statIcon)} aria-hidden="true">
        <Icon />
      </div>
      <div className={commonStyles.statContent}>
        <div className={cn(commonStyles.statNumber, themeStyles.statNumber)}>
          {prefix}{animatedValue}{suffix}
        </div>
        <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>{label}</div>
        <div className={cn(commonStyles.statDescription, themeStyles.statDescription)}>{description}</div>
      </div>
    </div>
  );
};

const SuccessStoryCard: React.FC<{ story: typeof successStories[0], themeStyles: any }> = ({ story, themeStyles }) => (
  <div className={cn(commonStyles.story, themeStyles.story)}>
    <div className={commonStyles.storyHeader}>
      <div className={cn(commonStyles.storyAvatar, themeStyles.storyAvatar)} aria-hidden="true">
        {story.name.split(' ').map(n => n[0]).join('')}
      </div>
      <div className={commonStyles.storyInfo}>
        <div className={cn(commonStyles.storyName, themeStyles.storyName)}>{story.name}</div>
        <div className={cn(commonStyles.storyRole, themeStyles.storyRole)}>{story.role}</div>
        <div className={cn(commonStyles.storyLocation, themeStyles.storyLocation)}>{story.city}, Pakistan</div>
      </div>
    </div>
    <div className={cn(commonStyles.storyAchievement, themeStyles.storyAchievement)}>{story.achievement}</div>
    <blockquote className={cn(commonStyles.storyQuote, themeStyles.storyQuote)}>&quot;{story.quote}&quot;</blockquote>
  </div>
);

const MissionSection: React.FC<{ themeStyles: any }> = ({ themeStyles }) => (
    <div className={cn(commonStyles.mission, themeStyles.mission)}>
        <div className={commonStyles.missionContent}>
            <h3 className={cn(commonStyles.missionTitle, themeStyles.missionTitle)}>Our Mission</h3>
            <p className={cn(commonStyles.missionText, themeStyles.missionText)}>
                To revolutionize freelance work in Pakistan and beyond using AI for automation and stable crypto for secure, accessible payments. We believe every talented individual deserves access to global opportunities, regardless of their location or banking infrastructure.
            </p>
            <div className={commonStyles.missionFeatures}>
                <div className={cn(commonStyles.missionFeature, themeStyles.missionFeature)}>
                    <FaHeart className={cn(commonStyles.missionFeatureIcon, themeStyles.missionFeatureIcon)} aria-hidden="true" />
                    <span>Built with Pakistani freelancers in mind</span>
                </div>
                <div className={cn(commonStyles.missionFeature, themeStyles.missionFeature)}>
                    <FaGlobe className={cn(commonStyles.missionFeatureIcon, themeStyles.missionFeatureIcon)} aria-hidden="true" />
                    <span>Designed for global success</span>
                </div>
            </div>
        </div>
        <WorldMap themeStyles={themeStyles} />
    </div>
);

const WorldMap: React.FC<{ themeStyles: any }> = ({ themeStyles }) => (
    <div className={cn(commonStyles.worldMap, themeStyles.worldMap)} aria-hidden="true">
        <div className={commonStyles.mapContainer}>
            {mapLocations.map(loc => (
                <div key={loc.name} className={cn(commonStyles.mapDot, loc.style)}>
                    <div className={commonStyles.mapPulse}></div>
                    <span className={commonStyles.mapLabel}>{loc.name}</span>
                </div>
            ))}
        </div>
    </div>
);

// --- Main Component ---

const GlobalImpact: React.FC = () => {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <section className={cn(commonStyles.globalImpact, themeStyles.globalImpact)}>
      <div className={commonStyles.globalImpactContainer}>
        <div className={commonStyles.globalImpactHeader}>
          <div className={cn(commonStyles.badge, themeStyles.badge)}>
            <FaFlag className={cn(commonStyles.badgeIcon, themeStyles.badgeIcon)} aria-hidden="true" />
            <span>Proudly Pakistani • Globally Connected</span>
          </div>
          <h2 className={cn(commonStyles.title, themeStyles.title)}>
            Empowering <span className={cn(commonStyles.titleHighlight, themeStyles.titleHighlight)}>Pakistani Talent</span> Worldwide
          </h2>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            MegiLance is more than a platform—it&apos;s a movement. We&apos;re breaking down barriers, 
            eliminating payment friction, and connecting Pakistan&apos;s incredible talent with 
            global opportunities. Join thousands who are already transforming their careers.
          </p>
        </div>

        <div className={cn(commonStyles.stats, themeStyles.stats)}>
          {impactStats.map((stat) => (
            <AnimatedStatCard key={stat.label} stat={stat} themeStyles={themeStyles} />
          ))}
        </div>

        <MissionSection themeStyles={themeStyles} />

        <div className={commonStyles.successStories}>
          <h3 className={cn(commonStyles.storiesTitle, themeStyles.storiesTitle)}>Success Stories from Pakistan</h3>
          <div className={cn(commonStyles.storiesGrid, themeStyles.storiesGrid)}>
            {successStories.map((story) => (
              <SuccessStoryCard key={story.name} story={story} themeStyles={themeStyles} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GlobalImpact;
