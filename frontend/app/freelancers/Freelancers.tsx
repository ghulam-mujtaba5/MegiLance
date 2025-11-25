// @AI-HINT: Freelancers page with theme-aware styling, animated sections, accessible filters - Uses real API data from /api/search/freelancers
'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import { api } from '@/lib/api';
import common from './Freelancers.common.module.css';
import light from './Freelancers.light.module.css';
import dark from './Freelancers.dark.module.css';

interface ApiFreelancer {
  id: number;
  email: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  hourly_rate: number | null;
  location: string | null;
  skills: string | null;
  user_type: string;
  is_active: boolean;
  created_at: string;
}

type Freelancer = {
  id: string;
  name: string;
  role: string;
  rate: number;
  location: string;
  skills: string[];
  avatar: string;
  bio: string;
};

// Convert API freelancer to display format
const apiToFreelancer = (apiFreelancer: ApiFreelancer): Freelancer => {
  // Build name from available fields
  let name = apiFreelancer.name;
  if (!name && (apiFreelancer.first_name || apiFreelancer.last_name)) {
    name = `${apiFreelancer.first_name || ''} ${apiFreelancer.last_name || ''}`.trim();
  }
  if (!name) {
    name = apiFreelancer.email.split('@')[0];
  }

  // Parse skills
  const skillsList = apiFreelancer.skills 
    ? apiFreelancer.skills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  // Generate role from skills or default
  const roleMap: Record<string, string> = {
    'react': 'Frontend Developer',
    'next.js': 'Full Stack Developer',
    'python': 'Python Developer',
    'node': 'Backend Developer',
    'design': 'Product Designer',
    'figma': 'UI/UX Designer',
    'solidity': 'Blockchain Developer',
    'data': 'Data Scientist',
  };

  let role = 'Freelancer';
  for (const [skill, roleName] of Object.entries(roleMap)) {
    if (skillsList.some(s => s.toLowerCase().includes(skill))) {
      role = roleName;
      break;
    }
  }

  // Generate avatar placeholder or use default
  const avatarColors = ['4573df', '27AE60', 'ff9800', 'e74c3c', '9b59b6', '1abc9c'];
  const colorIndex = Math.abs(apiFreelancer.id) % avatarColors.length;
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${avatarColors[colorIndex]}&color=fff&size=112`;

  return {
    id: String(apiFreelancer.id),
    name,
    role,
    rate: apiFreelancer.hourly_rate || 75,
    location: apiFreelancer.location || 'Remote',
    skills: skillsList.slice(0, 5),
    avatar,
    bio: apiFreelancer.bio || `Experienced ${role} available for projects.`,
  };
};

const rates = ['Any', '< $75', '$75–$100', '$100–$125', '> $125'] as const;
const locations = ['Any', 'US', 'EU', 'APAC', 'LATAM', 'Remote'] as const;

const Freelancers: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const themed = resolvedTheme === 'dark' ? dark : light;

  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [rate, setRate] = useState<(typeof rates)[number]>('Any');
  const [location, setLocation] = useState<(typeof locations)[number]>('Any');

  const headerRef = useRef<HTMLElement | null>(null);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const filtersVisible = useIntersectionObserver(filtersRef, { threshold: 0.1 });
  const gridVisible = useIntersectionObserver(gridRef, { threshold: 0.1 });

  // Fetch freelancers from API
  const fetchFreelancers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: any = { limit: 50 };
      const data: any = await api.search.freelancers(keyword, filters);
      const freelancers = Array.isArray(data) ? data : (data.items || []);
      setFreelancers(freelancers.map(apiToFreelancer));
    } catch (err) {
      console.error('Error fetching freelancers:', err);
      setError('Unable to load freelancers. Please try again later.');
      setFreelancers([]);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    fetchFreelancers();
  }, [fetchFreelancers]);

  // Client-side filtering for rate and location
  const filtered = useMemo(() => {
    return freelancers.filter((f) => {
      let rateOk = true;
      if (rate === '< $75') rateOk = f.rate < 75;
      else if (rate === '$75–$100') rateOk = f.rate >= 75 && f.rate <= 100;
      else if (rate === '$100–$125') rateOk = f.rate > 100 && f.rate <= 125;
      else if (rate === '> $125') rateOk = f.rate > 125;

      const locOk =
        location === 'Any' ||
        f.location.toLowerCase().includes(location.toLowerCase());

      return rateOk && locOk;
    });
  }, [freelancers, rate, location]);

  // Prevent flash during theme resolution
  if (!resolvedTheme) return null;

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <header
          ref={headerRef as React.RefObject<HTMLElement>}
          className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}
        >
          <span className={common.headerBadge}>🌟 Verified Talent</span>
          <h1 className={common.title}>Find Top Freelancers</h1>
          <p className={cn(common.subtitle, themed.subtitle)}>Search by skill, location, and rate to discover vetted talent ready to help you succeed.</p>
        </header>

        <div
          ref={filtersRef}
          className={cn(common.filters, themed.filters, filtersVisible ? common.isVisible : common.isNotVisible)}
          role="search"
          aria-label="Freelancer search filters"
        >
          <div className={common.filterGroup}>
            <label className={cn(common.label, themed.label)} htmlFor="kw">Search</label>
            <input
              id="kw"
              className={cn(common.input, themed.input)}
              type="search"
              placeholder="Search by name, role, or skill"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className={common.filterGroup}>
            <label className={cn(common.label, themed.label)} htmlFor="rate">Rate</label>
            <select
              id="rate"
              className={cn(common.select, themed.select)}
              value={rate}
              onChange={(e) => setRate(e.target.value as (typeof rates)[number])}
            >
              {rates.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className={common.filterGroup}>
            <label className={cn(common.label, themed.label)} htmlFor="loc">Location</label>
            <select
              id="loc"
              className={cn(common.select, themed.select)}
              value={location}
              onChange={(e) => setLocation(e.target.value as (typeof locations)[number])}
            >
              {locations.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <button 
            className={cn(common.searchButton, themed.searchButton)} 
            onClick={fetchFreelancers} 
            aria-label="Apply filters"
          >
            <svg className={common.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            Search
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={cn(common.loadingContainer, themed.loadingContainer)}>
            <div className={common.spinner} />
            <p>Finding top talent...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className={cn(common.errorContainer, themed.errorContainer)} role="alert">
            <span className={common.errorIcon}>⚠️</span>
            <p>{error}</p>
            <button className={cn(common.retryButton, themed.retryButton)} onClick={fetchFreelancers}>
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <>
            <div className={cn(common.resultsHeader, themed.resultsHeader)}>
              <span className={common.resultsCount}>
                {filtered.length} freelancer{filtered.length !== 1 ? 's' : ''} available
              </span>
            </div>

            <section aria-label="Freelancers results">
              <div
                ref={gridRef}
                className={cn(common.grid, gridVisible ? common.isVisible : common.isNotVisible)}
              >
                {filtered.map((f, index) => (
                  <article 
                    key={f.id} 
                    className={cn(common.card, themed.card)} 
                    aria-labelledby={`name-${f.id}`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className={common.cardHeader}>
                      <Image
                        className={common.avatar}
                        src={f.avatar}
                        alt={`${f.name} avatar`}
                        width={72}
                        height={72}
                        loading="lazy"
                        unoptimized
                      />
                      <div className={common.cardHeaderInfo}>
                        <h3 id={`name-${f.id}`} className={cn(common.name, themed.name)}>{f.name}</h3>
                        <div className={cn(common.role, themed.role)}>{f.role}</div>
                        <div className={cn(common.rateTag, themed.rateTag)}>
                          ${f.rate}/hr
                        </div>
                      </div>
                    </div>

                    <div className={cn(common.meta, themed.meta)}>
                      <span className={common.metaItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={common.metaIcon}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {f.location}
                      </span>
                    </div>

                    {f.bio && (
                      <p className={cn(common.bio, themed.bio)}>{f.bio}</p>
                    )}

                    <div className={common.skills} aria-label="Skills">
                      {f.skills.map((s) => (
                        <span key={s} className={cn(common.skill, themed.skill)}>{s}</span>
                      ))}
                    </div>

                    <div className={common.actions}>
                      <button 
                        className={cn(common.button, themed.button)} 
                        onClick={() => router.push(`/profile/${f.id}`)}
                        aria-label={`View ${f.name}'s profile`}
                      >
                        View Profile
                      </button>
                      <button 
                        className={cn(common.button, common.buttonSecondary, themed.buttonSecondary)} 
                        aria-label={`Contact ${f.name}`}
                      >
                        Contact
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className={cn(common.emptyState, themed.emptyState)}>
                  <span className={common.emptyIcon}>👥</span>
                  <h3>No freelancers found</h3>
                  <p>Try adjusting your search filters to find more talent.</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default Freelancers;
