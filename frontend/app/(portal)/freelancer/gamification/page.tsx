// @AI-HINT: Gamification dashboard - Points, badges, achievements, leaderboard
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { gamificationApi } from '@/lib/api';
import Card from '@/app/components/Card/Card';
import Badge from '@/app/components/Badge/Badge';
import ProgressBar from '@/app/components/ProgressBar/ProgressBar';
import Loader from '@/app/components/Loader/Loader';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import Tabs from '@/app/components/Tabs/Tabs';
import commonStyles from './Gamification.common.module.css';
import lightStyles from './Gamification.light.module.css';
import darkStyles from './Gamification.dark.module.css';

interface GamificationProfile {
  user_id: number;
  points: number;
  level: number;
  level_name: string;
  next_level_points: number;
  badges: any[];
  streak: { current: number; longest: number };
}

interface BadgeInfo {
  badge: string;
  name: string;
  description: string;
  tier: string;
  points: number;
  earned: boolean;
  earned_at?: string;
  progress?: number;
}

interface LeaderboardEntry {
  rank: number;
  user_id: number;
  name: string;
  avatar?: string;
  points: number;
  level: number;
  badges_count: number;
}

export default function GamificationPage() {
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [badges, setBadges] = useState<{ badges: BadgeInfo[]; by_tier: Record<string, BadgeInfo[]> } | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ entries: LeaderboardEntry[]; your_rank: any } | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [checkingIn, setCheckingIn] = useState(false);

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  useEffect(() => {
    loadGamificationData();
  }, []);

  const loadGamificationData = async () => {
    try {
      setLoading(true);
      const [profileData, badgesData, leaderboardData] = await Promise.all([
        gamificationApi.getProfile(),
        gamificationApi.getBadges(),
        gamificationApi.getLeaderboard(),
      ]);
      setProfile(profileData);
      setBadges(badgesData);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Failed to load gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      await gamificationApi.checkIn();
      await loadGamificationData();
    } catch (error) {
      console.error('Check-in failed:', error);
    } finally {
      setCheckingIn(false);
    }
  };

  if (!resolvedTheme) return null;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <Loader size="lg" />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'badges', label: 'Badges' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'activity', label: 'Activity' },
  ];

  const progressToNextLevel = profile
    ? ((profile.points % 1000) / (profile.next_level_points - (profile.points - (profile.points % 1000)))) * 100
    : 0;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={cn(commonStyles.header, themeStyles.header)}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Achievements & Rewards</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Track your progress, earn badges, and climb the leaderboard
          </p>
        </div>
        <button
          onClick={handleCheckIn}
          disabled={checkingIn}
          className={cn(commonStyles.checkInBtn, themeStyles.checkInBtn)}
        >
          {checkingIn ? 'Checking in...' : '🔥 Daily Check-in'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className={cn(commonStyles.statsGrid, themeStyles.statsGrid)}>
        <Card className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <div className={cn(commonStyles.statIcon, themeStyles.statIcon)}>⭐</div>
          <div className={cn(commonStyles.statValue, themeStyles.statValue)}>
            {profile?.points?.toLocaleString() || 0}
          </div>
          <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Points</div>
        </Card>

        <Card className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <div className={cn(commonStyles.statIcon, themeStyles.statIcon)}>🏆</div>
          <div className={cn(commonStyles.statValue, themeStyles.statValue)}>
            Level {profile?.level || 1}
          </div>
          <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>{profile?.level_name || 'Newcomer'}</div>
        </Card>

        <Card className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <div className={cn(commonStyles.statIcon, themeStyles.statIcon)}>🔥</div>
          <div className={cn(commonStyles.statValue, themeStyles.statValue)}>
            {profile?.streak?.current || 0} Days
          </div>
          <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Current Streak</div>
        </Card>

        <Card className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <div className={cn(commonStyles.statIcon, themeStyles.statIcon)}>🎖️</div>
          <div className={cn(commonStyles.statValue, themeStyles.statValue)}>
            {badges?.badges?.filter(b => b.earned).length || 0}
          </div>
          <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Badges Earned</div>
        </Card>
      </div>

      {/* Level Progress */}
      <Card className={cn(commonStyles.levelCard, themeStyles.levelCard)}>
        <div className={cn(commonStyles.levelHeader, themeStyles.levelHeader)}>
          <span>Level {profile?.level || 1} Progress</span>
          <span>{profile?.points?.toLocaleString() || 0} / {profile?.next_level_points?.toLocaleString() || 1000} XP</span>
        </div>
        <ProgressBar value={progressToNextLevel} max={100} showLabel={false} />
        <p className={cn(commonStyles.levelHint, themeStyles.levelHint)}>
          {Math.max(0, (profile?.next_level_points || 1000) - (profile?.points || 0)).toLocaleString()} points until next level
        </p>
      </Card>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div className={cn(commonStyles.tabContent, themeStyles.tabContent)}>
        {activeTab === 'overview' && (
          <div className={cn(commonStyles.overviewGrid, themeStyles.overviewGrid)}>
            {/* Recent Badges */}
            <Card className={cn(commonStyles.sectionCard, themeStyles.sectionCard)}>
              <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Recent Badges</h3>
              <div className={cn(commonStyles.badgeGrid, themeStyles.badgeGrid)}>
                {badges?.badges?.filter(b => b.earned).slice(0, 6).map((badge) => (
                  <div key={badge.badge} className={cn(commonStyles.badgeItem, themeStyles.badgeItem)}>
                    <div className={cn(commonStyles.badgeIcon, themeStyles.badgeIcon, themeStyles[`badge${badge.tier}`])}>
                      🏅
                    </div>
                    <span className={cn(commonStyles.badgeName, themeStyles.badgeName)}>{badge.name}</span>
                  </div>
                ))}
                {(!badges?.badges?.filter(b => b.earned).length) && (
                  <p className={cn(commonStyles.emptyText, themeStyles.emptyText)}>
                    Complete tasks to earn your first badge!
                  </p>
                )}
              </div>
            </Card>

            {/* Top Leaderboard */}
            <Card className={cn(commonStyles.sectionCard, themeStyles.sectionCard)}>
              <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Top Performers</h3>
              <div className={cn(commonStyles.leaderList, themeStyles.leaderList)}>
                {leaderboard?.entries?.slice(0, 5).map((entry, index) => (
                  <div key={entry.user_id} className={cn(commonStyles.leaderItem, themeStyles.leaderItem)}>
                    <span className={cn(commonStyles.leaderRank, themeStyles.leaderRank, index < 3 && themeStyles[`rank${index + 1}`])}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${entry.rank}`}
                    </span>
                    <span className={cn(commonStyles.leaderName, themeStyles.leaderName)}>{entry.name}</span>
                    <span className={cn(commonStyles.leaderPoints, themeStyles.leaderPoints)}>
                      {entry.points.toLocaleString()} pts
                    </span>
                  </div>
                ))}
              </div>
              {leaderboard?.your_rank && (
                <div className={cn(commonStyles.yourRank, themeStyles.yourRank)}>
                  Your Rank: #{leaderboard.your_rank.rank}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className={cn(commonStyles.badgesSection, themeStyles.badgesSection)}>
            {['platinum', 'gold', 'silver', 'bronze'].map((tier) => (
              <div key={tier} className={cn(commonStyles.tierSection, themeStyles.tierSection)}>
                <h3 className={cn(commonStyles.tierTitle, themeStyles.tierTitle, themeStyles[`tier${tier}`])}>
                  {tier.charAt(0).toUpperCase() + tier.slice(1)} Badges
                </h3>
                <div className={cn(commonStyles.badgeGridLarge, themeStyles.badgeGridLarge)}>
                  {badges?.by_tier?.[tier]?.map((badge) => (
                    <Card
                      key={badge.badge}
                      className={cn(
                        commonStyles.badgeCard,
                        themeStyles.badgeCard,
                        badge.earned && themeStyles.badgeEarned
                      )}
                    >
                      <div className={cn(commonStyles.badgeIconLarge, themeStyles.badgeIconLarge, themeStyles[`badge${tier}`])}>
                        {badge.earned ? '🏅' : '🔒'}
                      </div>
                      <h4 className={cn(commonStyles.badgeCardName, themeStyles.badgeCardName)}>{badge.name}</h4>
                      <p className={cn(commonStyles.badgeDescription, themeStyles.badgeDescription)}>
                        {badge.description}
                      </p>
                      <div className={cn(commonStyles.badgePoints, themeStyles.badgePoints)}>
                        +{badge.points} points
                      </div>
                      {badge.earned && badge.earned_at && (
                        <Badge variant="success" size="sm">Earned</Badge>
                      )}
                      {!badge.earned && badge.progress !== undefined && (
                        <ProgressBar value={badge.progress} max={100} size="sm" />
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <Card className={cn(commonStyles.leaderboardCard, themeStyles.leaderboardCard)}>
            <div className={cn(commonStyles.leaderboardHeader, themeStyles.leaderboardHeader)}>
              <h3>Global Leaderboard</h3>
              <select className={cn(commonStyles.periodSelect, themeStyles.periodSelect)}>
                <option value="all_time">All Time</option>
                <option value="monthly">This Month</option>
                <option value="weekly">This Week</option>
              </select>
            </div>
            <div className={cn(commonStyles.leaderboardTable, themeStyles.leaderboardTable)}>
              <div className={cn(commonStyles.leaderboardHeaderRow, themeStyles.leaderboardHeaderRow)}>
                <span>Rank</span>
                <span>User</span>
                <span>Level</span>
                <span>Points</span>
                <span>Badges</span>
              </div>
              {leaderboard?.entries?.map((entry, index) => (
                <div
                  key={entry.user_id}
                  className={cn(
                    commonStyles.leaderboardRow,
                    themeStyles.leaderboardRow,
                    leaderboard.your_rank?.user_id === entry.user_id && themeStyles.yourRow
                  )}
                >
                  <span className={cn(commonStyles.rankCell, themeStyles.rankCell)}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${entry.rank}`}
                  </span>
                  <span className={cn(commonStyles.userCell, themeStyles.userCell)}>
                    <div className={cn(commonStyles.userAvatar, themeStyles.userAvatar)}>
                      {entry.name.charAt(0)}
                    </div>
                    {entry.name}
                  </span>
                  <span>Level {entry.level}</span>
                  <span className={cn(commonStyles.pointsCell, themeStyles.pointsCell)}>
                    {entry.points.toLocaleString()}
                  </span>
                  <span>{entry.badges_count}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'activity' && (
          <Card className={cn(commonStyles.activityCard, themeStyles.activityCard)}>
            <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Recent Activity</h3>
            <EmptyState
              icon="📊"
              title="Activity tracking coming soon"
              description="Your point-earning activities will appear here"
            />
          </Card>
        )}
      </div>
    </div>
  );
}
