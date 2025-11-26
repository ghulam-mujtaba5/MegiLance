// @AI-HINT: Search analytics page for admin to monitor search patterns
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { searchAnalyticsApi } from '@/lib/api';
import Button from '@/app/components/Button/Button';
import Tabs from '@/app/components/Tabs/Tabs';
import commonStyles from './SearchAnalytics.common.module.css';
import lightStyles from './SearchAnalytics.light.module.css';
import darkStyles from './SearchAnalytics.dark.module.css';

interface SearchTerm {
  term: string;
  count: number;
  clicks: number;
  ctr: number;
  avg_position: number;
  trend: 'up' | 'down' | 'stable';
}

interface SearchStats {
  total_searches: number;
  unique_searches: number;
  searches_today: number;
  avg_results: number;
  zero_result_rate: number;
}

interface ZeroResultQuery {
  query: string;
  count: number;
  last_searched: string;
}

export default function SearchAnalyticsPage() {
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [topSearches, setTopSearches] = useState<SearchTerm[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<SearchTerm[]>([]);
  const [zeroResults, setZeroResults] = useState<ZeroResultQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, topRes, trendingRes, zeroRes] = await Promise.all([
        searchAnalyticsApi.getStats({ range: dateRange }),
        searchAnalyticsApi.getTopSearches({ range: dateRange, limit: 20 }),
        searchAnalyticsApi.getTrendingSearches({ range: dateRange }),
        searchAnalyticsApi.getZeroResultQueries({ range: dateRange })
      ]);
      setStats(statsRes);
      setTopSearches(topRes || []);
      setTrendingSearches(trendingRes || []);
      setZeroResults(zeroRes || []);
    } catch (err) {
      console.error('Failed to load search analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➡️';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'top', label: '🔝 Top Searches' },
    { id: 'trending', label: '🔥 Trending' },
    { id: 'zero', label: '⚠️ Zero Results' }
  ];

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={commonStyles.loading}>Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <header className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Search Analytics</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Monitor search patterns and optimize discovery
          </p>
        </div>
        <div className={commonStyles.dateFilter}>
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className={cn(commonStyles.select, themeStyles.select)}
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </header>

      {/* Stats */}
      {stats && (
        <div className={commonStyles.statsRow}>
          <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={commonStyles.statIcon}>🔍</span>
            <div className={commonStyles.statInfo}>
              <strong>{stats.total_searches.toLocaleString()}</strong>
              <span>Total Searches</span>
            </div>
          </div>
          <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={commonStyles.statIcon}>👤</span>
            <div className={commonStyles.statInfo}>
              <strong>{stats.unique_searches.toLocaleString()}</strong>
              <span>Unique Queries</span>
            </div>
          </div>
          <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={commonStyles.statIcon}>📅</span>
            <div className={commonStyles.statInfo}>
              <strong>{stats.searches_today}</strong>
              <span>Today</span>
            </div>
          </div>
          <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={commonStyles.statIcon}>📊</span>
            <div className={commonStyles.statInfo}>
              <strong>{stats.avg_results.toFixed(1)}</strong>
              <span>Avg Results</span>
            </div>
          </div>
          <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={commonStyles.statIcon}>⚠️</span>
            <div className={commonStyles.statInfo}>
              <strong>{(stats.zero_result_rate * 100).toFixed(1)}%</strong>
              <span>Zero Results</span>
            </div>
          </div>
        </div>
      )}

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className={commonStyles.tabContent}>
        {activeTab === 'overview' && (
          <div className={commonStyles.overviewGrid}>
            <div className={cn(commonStyles.card, themeStyles.card)}>
              <h3>Top Search Terms</h3>
              <div className={commonStyles.termsList}>
                {topSearches.slice(0, 5).map((term, i) => (
                  <div key={i} className={cn(commonStyles.termItem, themeStyles.termItem)}>
                    <span className={commonStyles.rank}>#{i + 1}</span>
                    <span className={commonStyles.termText}>{term.term}</span>
                    <span className={commonStyles.count}>{term.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={cn(commonStyles.card, themeStyles.card)}>
              <h3>Trending Now</h3>
              <div className={commonStyles.termsList}>
                {trendingSearches.slice(0, 5).map((term, i) => (
                  <div key={i} className={cn(commonStyles.termItem, themeStyles.termItem)}>
                    <span className={commonStyles.trendIcon}>{getTrendIcon(term.trend)}</span>
                    <span className={commonStyles.termText}>{term.term}</span>
                    <span className={cn(
                      commonStyles.change,
                      term.trend === 'up' && commonStyles.up,
                      term.trend === 'down' && commonStyles.down
                    )}>
                      {term.trend === 'up' ? '+' : ''}{((term.count / 100) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={cn(commonStyles.card, themeStyles.card)}>
              <h3>Zero Result Queries</h3>
              <div className={commonStyles.termsList}>
                {zeroResults.slice(0, 5).map((query, i) => (
                  <div key={i} className={cn(commonStyles.termItem, themeStyles.termItem)}>
                    <span className={commonStyles.warningIcon}>⚠️</span>
                    <span className={commonStyles.termText}>{query.query}</span>
                    <span className={commonStyles.count}>{query.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'top' && (
          <div className={cn(commonStyles.tableCard, themeStyles.tableCard)}>
            <table className={commonStyles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Search Term</th>
                  <th>Searches</th>
                  <th>Clicks</th>
                  <th>CTR</th>
                  <th>Avg Position</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {topSearches.map((term, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td className={commonStyles.termCell}>{term.term}</td>
                    <td>{term.count.toLocaleString()}</td>
                    <td>{term.clicks}</td>
                    <td>{(term.ctr * 100).toFixed(1)}%</td>
                    <td>{term.avg_position.toFixed(1)}</td>
                    <td>{getTrendIcon(term.trend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'trending' && (
          <div className={commonStyles.trendingGrid}>
            {trendingSearches.map((term, i) => (
              <div key={i} className={cn(commonStyles.trendCard, themeStyles.trendCard)}>
                <div className={commonStyles.trendHeader}>
                  <span className={commonStyles.trendRank}>#{i + 1}</span>
                  <span className={cn(
                    commonStyles.trendBadge,
                    term.trend === 'up' && commonStyles.trendUp,
                    term.trend === 'down' && commonStyles.trendDown
                  )}>
                    {getTrendIcon(term.trend)} {term.trend}
                  </span>
                </div>
                <h3>{term.term}</h3>
                <div className={commonStyles.trendStats}>
                  <div>
                    <strong>{term.count}</strong>
                    <span>Searches</span>
                  </div>
                  <div>
                    <strong>{term.clicks}</strong>
                    <span>Clicks</span>
                  </div>
                  <div>
                    <strong>{(term.ctr * 100).toFixed(1)}%</strong>
                    <span>CTR</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'zero' && (
          <div className={commonStyles.zeroSection}>
            <div className={cn(commonStyles.alertCard, themeStyles.alertCard)}>
              <h3>⚠️ Attention Required</h3>
              <p>These queries returned no results. Consider adding relevant content or improving search indexing.</p>
            </div>
            
            <div className={cn(commonStyles.tableCard, themeStyles.tableCard)}>
              <table className={commonStyles.table}>
                <thead>
                  <tr>
                    <th>Query</th>
                    <th>Occurrences</th>
                    <th>Last Searched</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {zeroResults.map((query, i) => (
                    <tr key={i}>
                      <td className={commonStyles.termCell}>{query.query}</td>
                      <td>{query.count}</td>
                      <td>{formatDate(query.last_searched)}</td>
                      <td>
                        <Button variant="ghost" size="sm">
                          Add Synonym
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
