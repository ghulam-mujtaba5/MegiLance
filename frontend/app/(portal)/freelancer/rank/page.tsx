// @AI-HINT: This is the Freelancer Rank page, showcasing the AI-powered ranking system. It has been fully refactored for a premium, theme-aware, and data-centric design.
'use client';

import api from '@/lib/api';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';

import ProgressBar from '@/app/components/ProgressBar/ProgressBar';
import RankGauge from '@/app/components/RankGauge/RankGauge';
import Button from '@/app/components/Button/Button';
import { cn } from '@/lib/utils';
import commonStyles from './RankPage.common.module.css';
import lightStyles from './RankPage.light.module.css';
import darkStyles from './RankPage.dark.module.css';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';

interface ReviewStats {
  user_id: number;
  total_reviews: number;
  average_rating: number;
  communication_rating: number;
  quality_rating: number;
  professionalism_rating: number;
  deadline_rating: number;
  rating_distribution: Record<string, number>;
}

interface RankData {
  overallRank: string;
  rankScore: number;
  factors: Array<{ label: string; score: number; description: string }>;
}

// Calculate rank from stats
const calculateRankFromStats = (stats: ReviewStats): RankData => {
  // Calculate overall score (0-100)
  const avgRating = stats.average_rating || 0;
  const commRating = stats.communication_rating || avgRating;
  const qualityRating = stats.quality_rating || avgRating;
  const profRating = stats.professionalism_rating || avgRating;
  const deadlineRating = stats.deadline_rating || avgRating;
  
  // Weight factors
  const overallScore = Math.round(
    (avgRating / 5) * 100 * 0.3 +     // 30% weight on overall rating
    (qualityRating / 5) * 100 * 0.25 + // 25% on quality
    (commRating / 5) * 100 * 0.2 +     // 20% on communication
    (profRating / 5) * 100 * 0.15 +    // 15% on professionalism
    (deadlineRating / 5) * 100 * 0.1   // 10% on deadline adherence
  );
  
  // Calculate rank tier
  let rankTier = 'New Freelancer';
  if (stats.total_reviews >= 1) {
    if (overallScore >= 95) rankTier = 'Top 5%';
    else if (overallScore >= 90) rankTier = 'Top 10%';
    else if (overallScore >= 80) rankTier = 'Top 25%';
    else if (overallScore >= 70) rankTier = 'Rising Star';
    else if (overallScore >= 50) rankTier = 'Established';
    else rankTier = 'Growing';
  }
  
  return {
    overallRank: rankTier,
    rankScore: overallScore || 0,
    factors: [
      { 
        label: 'Job Success Score', 
        score: Math.round((avgRating / 5) * 100) || 0, 
        description: 'Based on client satisfaction and successful project completions.' 
      },
      { 
        label: 'Quality of Work', 
        score: Math.round((qualityRating / 5) * 100) || 0, 
        description: 'Reflects the quality ratings from completed projects.' 
      },
      { 
        label: 'Communication', 
        score: Math.round((commRating / 5) * 100) || 0, 
        description: 'Based on client feedback about response times and clarity.' 
      },
      { 
        label: 'On-Time Delivery', 
        score: Math.round((deadlineRating / 5) * 100) || 0, 
        description: 'Based on meeting deadlines for all project milestones.' 
      },
    ],
  };
};

const RankFactor: React.FC<{ label: string; score: number; description: string; styles: any }> = ({ label, score, description, styles }) => {
  return (
    <div className={cn(styles.rankFactor)}>
      <div className={cn(styles.factorHeader)}>
        <span className={cn(styles.label)}>{label}</span>
        <span className={cn(styles.score)}>{score}/100</span>
      </div>
      <ProgressBar progress={score} />
      <p className={cn(styles.factorDescription)}>{description}</p>
    </div>
  );
};

const RankPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [rankData, setRankData] = useState<RankData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  const fetchRankData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current user
      const userData = await api.auth.me();
      const userId = userData.id;
      
      // Fetch review stats
      try {
        const statsData = await api.reviews.getStats(userId);
        const calculated = calculateRankFromStats(statsData as ReviewStats);
        setRankData(calculated);
      } catch (err) {
        // No reviews yet - show default
        setRankData({
          overallRank: 'New Freelancer',
          rankScore: 0,
          factors: [
            { label: 'Job Success Score', score: 0, description: 'Complete your first project to get rated.' },
            { label: 'Quality of Work', score: 0, description: 'Quality ratings will appear after client reviews.' },
            { label: 'Communication', score: 0, description: 'Communication scores based on client feedback.' },
            { label: 'On-Time Delivery', score: 0, description: 'Deadline adherence scores from project completions.' },
          ],
        });
      }
    } catch (err) {
      console.error('Failed to fetch rank data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rank data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRankData();
  }, [fetchRankData]);

  if (!resolvedTheme) return null;

  return (
    <PageTransition>
      <div className={cn(styles.pageWrapper)}>
        <ScrollReveal>
          <header className={cn(styles.header)}>
            <div className={cn(styles.titleGroup)}>
              <h1>My Freelancer Rank</h1>
              <p>Understand your AI-powered rank and how to improve it.</p>
            </div>
          </header>
        </ScrollReveal>

        {error ? (
          <ScrollReveal>
            <div className={cn(styles.errorState)}>
              <h3>Unable to Load Rank Data</h3>
              <p>{error}</p>
              <Button variant="primary" onClick={fetchRankData}>Try Again</Button>
            </div>
          </ScrollReveal>
        ) : loading ? (
          <div className={cn(styles.loadingState)}>
            <div className={cn(styles.spinner)} />
            <p>Loading your rank...</p>
          </div>
        ) : rankData && (
          <main className={cn(styles.mainGrid)}>
            <span className={cn(styles.srOnly)} aria-live="polite">
              {`Overall rank ${rankData.overallRank}. Rank score ${rankData.rankScore} out of 100.`}
            </span>
            <aside>
              <ScrollReveal delay={0.1}>
                <div className={cn(styles.rankDisplayCard)} role="region" aria-label="Your current rank" title="Your current rank">
                  <h2>Your Current Rank</h2>
                  <p className={cn(styles.scoreText)}>{rankData.overallRank}</p>
                  <RankGauge score={rankData.rankScore} />
                </div>
              </ScrollReveal>
            </aside>

            <section className={cn(styles.factorsContainer)} role="region" aria-label="Rank factors" title="Rank factors">
              <ScrollReveal delay={0.2}>
                <h2>How Your Rank is Calculated</h2>
              </ScrollReveal>
              <StaggerContainer className={cn(styles.factorsGrid)}>
                {rankData.factors.map((factor, index) => (
                  <StaggerItem key={index}>
                    <RankFactor {...factor} styles={styles} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </section>
          </main>
        )}
      </div>
    </PageTransition>
  );
};

export default RankPage;

