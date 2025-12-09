// @AI-HINT: Freelancer rank/level page - gamification system showing progress and achievements
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './Rank.common.module.css';
import lightStyles from './Rank.light.module.css';
import darkStyles from './Rank.dark.module.css';

interface RankData {
  current_rank: string;
  rank_level: number;
  total_points: number;
  points_to_next: number;
  next_rank: string;
  progress_percent: number;
  badges: Badge[];
  stats: RankStats;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

interface RankStats {
  completed_projects: number;
  on_time_delivery: number;
  client_satisfaction: number;
  repeat_clients: number;
  total_earnings: number;
}

const RANKS = [
  { name: 'Newcomer', level: 1, points: 0, color: '#6b7280' },
  { name: 'Rising Star', level: 2, points: 100, color: '#10b981' },
  { name: 'Professional', level: 3, points: 500, color: '#3b82f6' },
  { name: 'Expert', level: 4, points: 1500, color: '#8b5cf6' },
  { name: 'Top Rated', level: 5, points: 5000, color: '#f59e0b' },
  { name: 'Elite', level: 6, points: 15000, color: '#ef4444' },
];

export default function RankPage() {
  const { resolvedTheme } = useTheme();
  const [rankData, setRankData] = useState<RankData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankData();
  }, []);

  const loadRankData = async () => {
    try {
      setLoading(true);
      // Rank API not yet implemented, using demo data
      
      // Demo data
      setRankData({
        current_rank: 'Professional',
        rank_level: 3,
        total_points: 1247,
        points_to_next: 253,
        next_rank: 'Expert',
        progress_percent: 75,
        badges: [
          { id: '1', name: 'First Project', description: 'Completed your first project', icon: '🎉', earned_at: '2024-01-15', rarity: 'common' },
          { id: '2', name: 'Fast Responder', description: 'Average response time under 1 hour', icon: '⚡', earned_at: '2024-02-20', rarity: 'uncommon' },
          { id: '3', name: 'Five Star', description: 'Received 10 five-star reviews', icon: '⭐', earned_at: '2024-03-10', rarity: 'rare' },
          { id: '4', name: 'On Time Master', description: '100% on-time delivery rate', icon: '⏰', earned_at: '2024-04-05', rarity: 'rare' },
          { id: '5', name: 'Client Favorite', description: '5 repeat clients', icon: '❤️', earned_at: '2024-05-15', rarity: 'epic' },
          { id: '6', name: 'Top Earner', description: 'Earned $10,000+ on platform', icon: '💰', earned_at: '2024-06-01', rarity: 'epic' },
        ],
        stats: {
          completed_projects: 34,
          on_time_delivery: 97,
          client_satisfaction: 98,
          repeat_clients: 8,
          total_earnings: 28500,
        },
      });
    } catch (error) {
      console.error('Failed to load rank data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (level: number) => {
    return RANKS[level - 1]?.color || '#6b7280';
  };

  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading || !rankData) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={cn(commonStyles.loadingState, themeStyles.loadingState)}>
          Loading rank data...
        </div>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <h1 className={cn(commonStyles.title, themeStyles.title)}>Your Rank & Progress</h1>
        <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
          Level up by completing projects and earning great reviews
        </p>
      </div>

      {/* Rank Card */}
      <div className={cn(commonStyles.rankCard, themeStyles.rankCard)}>
        <div className={commonStyles.rankBadge} style={{ background: getRankColor(rankData.rank_level) }}>
          <span className={commonStyles.rankLevel}>{rankData.rank_level}</span>
        </div>
        <div className={commonStyles.rankInfo}>
          <h2 className={cn(commonStyles.rankName, themeStyles.rankName)} style={{ color: getRankColor(rankData.rank_level) }}>
            {rankData.current_rank}
          </h2>
          <p className={cn(commonStyles.rankPoints, themeStyles.rankPoints)}>
            {rankData.total_points.toLocaleString()} XP
          </p>
        </div>
        <div className={commonStyles.progressSection}>
          <div className={commonStyles.progressHeader}>
            <span className={cn(commonStyles.progressLabel, themeStyles.progressLabel)}>
              Progress to {rankData.next_rank}
            </span>
            <span className={cn(commonStyles.progressValue, themeStyles.progressValue)}>
              {rankData.points_to_next} XP to go
            </span>
          </div>
          <div className={commonStyles.progressBar}>
            <div 
              className={commonStyles.progressFill}
              style={{ 
                width: `${rankData.progress_percent}%`,
                background: getRankColor(rankData.rank_level + 1)
              }}
            />
          </div>
        </div>
      </div>

      {/* Rank Tiers */}
      <div className={cn(commonStyles.section, themeStyles.section)}>
        <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Rank Tiers</h3>
        <div className={commonStyles.tiersGrid}>
          {RANKS.map((rank, index) => (
            <div 
              key={rank.name}
              className={cn(
                commonStyles.tierCard,
                themeStyles.tierCard,
                rankData.rank_level >= rank.level && commonStyles.tierUnlocked,
                rankData.rank_level >= rank.level && themeStyles.tierUnlocked,
                rankData.rank_level === rank.level && commonStyles.tierCurrent,
                rankData.rank_level === rank.level && themeStyles.tierCurrent
              )}
            >
              <div className={commonStyles.tierBadge} style={{ background: rank.color }}>
                {rank.level}
              </div>
              <div className={commonStyles.tierInfo}>
                <span className={cn(commonStyles.tierName, themeStyles.tierName)}>{rank.name}</span>
                <span className={cn(commonStyles.tierPoints, themeStyles.tierPoints)}>
                  {rank.points.toLocaleString()} XP
                </span>
              </div>
              {rankData.rank_level >= rank.level && (
                <svg className={commonStyles.checkIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={rank.color} strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className={cn(commonStyles.section, themeStyles.section)}>
        <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Your Stats</h3>
        <div className={commonStyles.statsGrid}>
          <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{rankData.stats.completed_projects}</span>
            <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Projects Completed</span>
          </div>
          <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{rankData.stats.on_time_delivery}%</span>
            <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>On-Time Delivery</span>
          </div>
          <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{rankData.stats.client_satisfaction}%</span>
            <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Client Satisfaction</span>
          </div>
          <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{rankData.stats.repeat_clients}</span>
            <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Repeat Clients</span>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className={cn(commonStyles.section, themeStyles.section)}>
        <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Earned Badges</h3>
        <div className={commonStyles.badgesGrid}>
          {rankData.badges.map(badge => (
            <div 
              key={badge.id}
              className={cn(
                commonStyles.badgeCard,
                themeStyles.badgeCard,
                commonStyles[`badge_${badge.rarity}`],
                themeStyles[`badge_${badge.rarity}`]
              )}
            >
              <span className={commonStyles.badgeIcon}>{badge.icon}</span>
              <div className={commonStyles.badgeInfo}>
                <span className={cn(commonStyles.badgeName, themeStyles.badgeName)}>{badge.name}</span>
                <span className={cn(commonStyles.badgeDesc, themeStyles.badgeDesc)}>{badge.description}</span>
              </div>
              <span className={cn(commonStyles.badgeRarity, themeStyles.badgeRarity, commonStyles[`rarity_${badge.rarity}`])}>
                {badge.rarity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
