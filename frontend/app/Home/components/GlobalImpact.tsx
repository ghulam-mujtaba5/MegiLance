// @AI-HINT: This is the main component for the Global Impact section, showcasing MegiLance's worldwide reach and empowering Pakistani talent.

'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Flag, Users, Globe, LineChart, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

import ImpactStatCard from './ImpactStatCard';
import SuccessStoryCard from './SuccessStoryCard';
import commonStyles from './GlobalImpact.common.module.css';
import lightStyles from './GlobalImpact.light.module.css';
import darkStyles from './GlobalImpact.dark.module.css';

// --- Dynamic Import for Globe (client-side only) ---
const ImpactGlobe = dynamic(() => import('./ImpactGlobe'), {
  loading: () => <div className={commonStyles.globePlaceholder} />
});

// --- Data Definitions (FYP Report Statistics) ---
const impactStats = [
  { icon: Users, number: "1M+", label: "Pakistani Freelancers", description: "Pakistan ranks 4th globally in freelancing, contributing $500M+ annually to the economy." },
  { icon: Globe, number: "45+", label: "Countries Served", description: "Connecting Pakistan's top talent across continents with global opportunities." },
  { icon: LineChart, number: "$455B+", label: "Global Market Size", description: "The freelancing industry continues to grow at 15% annually worldwide." },
  { icon: Star, number: "60-75%", label: "Fee Savings", description: "MegiLance charges 5-10% vs traditional platforms' 20-27% commissions." }
];

const successStories = [
  {
    name: "Ayesha Khan",
    role: "Lead UI/UX Designer",
    city: "Karachi",
    achievement: "Earned $50K+ in First Year",
    quote: "MegiLance's AI matching connected me with high-value international clients I only dreamed of. The stablecoin payments are a game-changer.",
    avatar: "https://i.pravatar.cc/150?img=47"
  },
  {
    name: "Muhammad Ali",
    role: "Senior Full-Stack Engineer",
    city: "Lahore",
    achievement: "Scaled a startup's MVP to 1M users",
    quote: "This platform handles all the overhead. I just focus on what I do best: writing clean, scalable code. It's freelancing, perfected.",
    avatar: "https://i.pravatar.cc/150?img=12"
  },
  {
    name: "Fatima Ahmed",
    role: "Expert Content Strategist",
    city: "Islamabad",
    achievement: "Top 1% Global Performer",
    quote: "The analytics are incredible. I've tripled my rates by understanding market demand and showcasing my value more effectively.",
    avatar: "https://i.pravatar.cc/150?img=65"
  }
];

// --- Main Component ---
const GlobalImpact: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <section className={cn(commonStyles.globalImpact, themeStyles.globalImpact)}>
      <div className={commonStyles.container}>
        
        {/* --- Header (FYP Mission Statement) --- */}
        <div className={commonStyles.header}>
          <div className={cn(commonStyles.badge, themeStyles.badge)}>
            <Flag size={14} />
            <span>FYP 2022-2026 | COMSATS University Islamabad</span>
          </div>
          <h2 className={cn(commonStyles.title, themeStyles.title)}>
            Where <span className={cn(commonStyles.highlight, themeStyles.highlight)}>Pakistani Talent</span> Meets Global Opportunity
          </h2>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Our mission is to democratize access to the global freelance economy by eliminating payment barriers, 
            reducing exploitative fees, and creating a transparent, merit-based marketplace powered by AI and blockchain technology.
          </p>
        </div>

        {/* --- Main Content Grid --- */}
        <div className={commonStyles.mainGrid}>
          <div className={commonStyles.globeSection}>
            <ImpactGlobe />
          </div>
          <div className={commonStyles.statsGrid}>
            {impactStats.map((stat) => (
              <ImpactStatCard key={stat.label} stat={stat} />
            ))}
          </div>
        </div>

        {/* --- Success Stories Section --- */}
        <div className={commonStyles.storiesSection}>
          <h3 className={cn(commonStyles.storiesTitle, themeStyles.storiesTitle)}>Success Stories from Our Community</h3>
          <div className={commonStyles.storiesGrid}>
            {successStories.map((story) => (
              <SuccessStoryCard key={story.name} story={story} />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default GlobalImpact;