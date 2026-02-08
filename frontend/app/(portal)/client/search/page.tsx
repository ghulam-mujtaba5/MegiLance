// @AI-HINT: Client Search page - talent search for finding freelancers
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import Loading from '@/app/components/Loading/Loading';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { searchingAnimation } from '@/app/components/Animations/LottieAnimation';
import { searchApi } from '@/lib/api';
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  DollarSign,
  Briefcase,
  MessageSquare,
  Heart
} from 'lucide-react';

import commonStyles from './Search.common.module.css';
import lightStyles from './Search.light.module.css';
import darkStyles from './Search.dark.module.css';

interface Freelancer {
  id: string;
  name: string;
  title: string;
  avatar_url?: string;
  rating: number;
  reviews_count: number;
  hourly_rate: number;
  location: string;
  skills: string[];
  completed_jobs: number;
}

export default function ClientSearchPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    minRate: '',
    maxRate: '',
    skills: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const response = await searchApi.freelancers(searchQuery, {
        hourly_rate_min: filters.minRate ? parseFloat(filters.minRate) : undefined,
        hourly_rate_max: filters.maxRate ? parseFloat(filters.maxRate) : undefined,
        skills: filters.skills ? filters.skills.split(',').map(s => s.trim()) : undefined,
      });
      
      const results = Array.isArray(response) ? response : (response as any).freelancers || [];
      setFreelancers(results.map((f: any) => ({
        id: f.id?.toString() || '',
        name: f.name || f.full_name || 'Freelancer',
        title: f.title || f.headline || 'Freelancer',
        avatar_url: f.avatar_url || f.profile_image_url,
        rating: f.rating || f.avg_rating || 0,
        reviews_count: f.reviews_count || 0,
        hourly_rate: f.hourly_rate || 0,
        location: f.location || 'Remote',
        skills: f.skills || [],
        completed_jobs: f.completed_jobs || f.completed_projects || 0,
      })));
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  if (!mounted) return <Loading />;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <h1 className={cn(commonStyles.title, themeStyles.title)}>Find Talent</h1>
        <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
          Search for skilled freelancers to work on your projects
        </p>
      </div>

      {/* Search Bar */}
      <div className={cn(commonStyles.searchSection, themeStyles.searchSection)}>
        <div className={commonStyles.searchWrapper}>
          <Search size={20} className={commonStyles.searchIcon} />
          <input
            type="text"
            placeholder="Search by skill, title, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className={cn(commonStyles.searchInput, themeStyles.searchInput)}
          />
          <Button variant="primary" onClick={handleSearch} isLoading={loading}>
            Search
          </Button>
        </div>
        
        {/* Filters */}
        <div className={commonStyles.filtersRow}>
          <div className={commonStyles.filterItem}>
            <label>Min Rate</label>
            <input
              type="number"
              placeholder="$0"
              value={filters.minRate}
              onChange={(e) => setFilters({ ...filters, minRate: e.target.value })}
              className={cn(commonStyles.filterInput, themeStyles.filterInput)}
            />
          </div>
          <div className={commonStyles.filterItem}>
            <label>Max Rate</label>
            <input
              type="number"
              placeholder="$200"
              value={filters.maxRate}
              onChange={(e) => setFilters({ ...filters, maxRate: e.target.value })}
              className={cn(commonStyles.filterInput, themeStyles.filterInput)}
            />
          </div>
          <div className={commonStyles.filterItem}>
            <label>Skills</label>
            <input
              type="text"
              placeholder="React, Python, Design..."
              value={filters.skills}
              onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
              className={cn(commonStyles.filterInput, themeStyles.filterInput)}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <Loading />
      ) : freelancers.length === 0 ? (
        <EmptyState
          title="Search for freelancers"
          description="Enter keywords to find talented freelancers for your projects."
          icon={<Search size={48} />}
          animationData={searchingAnimation}
          animationWidth={130}
          animationHeight={130}
        />
      ) : (
        <div className={commonStyles.resultsGrid}>
          {freelancers.map((freelancer) => (
            <div key={freelancer.id} className={cn(commonStyles.freelancerCard, themeStyles.freelancerCard)}>
              <div className={commonStyles.cardHeader}>
                <div className={commonStyles.avatar}>
                  {freelancer.avatar_url ? (
                    <img src={freelancer.avatar_url} alt={freelancer.name} />
                  ) : (
                    <span>{freelancer.name.charAt(0)}</span>
                  )}
                </div>
                <button className={commonStyles.favoriteBtn}>
                  <Heart size={18} />
                </button>
              </div>
              
              <h3 className={cn(commonStyles.name, themeStyles.name)}>{freelancer.name}</h3>
              <p className={cn(commonStyles.titleText, themeStyles.titleText)}>{freelancer.title}</p>
              
              <div className={commonStyles.meta}>
                <span className={commonStyles.rating}>
                  <Star size={14} fill="#F2C94C" stroke="#F2C94C" />
                  {freelancer.rating.toFixed(1)} ({freelancer.reviews_count})
                </span>
                <span className={commonStyles.location}>
                  <MapPin size={14} />
                  {freelancer.location}
                </span>
              </div>
              
              <div className={commonStyles.rate}>
                <DollarSign size={16} />
                ${freelancer.hourly_rate}/hr
              </div>
              
              <div className={commonStyles.skills}>
                {freelancer.skills.slice(0, 3).map((skill, i) => (
                  <span key={i} className={cn(commonStyles.skillTag, themeStyles.skillTag)}>
                    {skill}
                  </span>
                ))}
                {freelancer.skills.length > 3 && (
                  <span className={commonStyles.moreSkills}>+{freelancer.skills.length - 3}</span>
                )}
              </div>
              
              <div className={commonStyles.cardActions}>
                <Link href={`/freelancers/${freelancer.id}`}>
                  <Button variant="outline" size="sm" fullWidth>View Profile</Button>
                </Link>
                <Button variant="primary" size="sm" iconBefore={<MessageSquare size={14} />}>
                  Contact
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
