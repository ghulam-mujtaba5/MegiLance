// @AI-HINT: Jobs page: theme-aware, animated, accessible job listings with filters. Uses real API data from /api/search/projects
'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import api from '@/lib/api';
import common from './Jobs.common.module.css';
import light from './Jobs.light.module.css';
import dark from './Jobs.dark.module.css';

interface Project {
  id: number;
  title: string;
  description: string;
  category: string;
  budget_type: 'fixed' | 'hourly';
  budget_min: number | null;
  budget_max: number | null;
  experience_level: string;
  status: string;
  skills: string | string[];
  client_id: number;
  created_at: string;
  updated_at: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
  budget: string;
  description: string;
  featured?: boolean;
  category?: string;
  skills?: string[];
  created_at?: string;
}

// Convert API project to display Job format
const projectToJob = (project: Project): Job => {
  // Format budget based on budget_type and min/max
  let budget = 'Negotiable';
  if (project.budget_min !== null && project.budget_max !== null) {
    if (project.budget_type === 'hourly') {
      budget = `$${project.budget_min}–$${project.budget_max}/hr`;
    } else {
      budget = `$${project.budget_min.toLocaleString()}–$${project.budget_max.toLocaleString()}`;
    }
  } else if (project.budget_min !== null) {
    budget = project.budget_type === 'hourly' ? `$${project.budget_min}+/hr` : `$${project.budget_min.toLocaleString()}+`;
  } else if (project.budget_max !== null) {
    budget = project.budget_type === 'hourly' ? `Up to $${project.budget_max}/hr` : `Up to $${project.budget_max.toLocaleString()}`;
  }

  // Map experience level to job type
  const typeMap: Record<string, 'Full-time' | 'Part-time' | 'Contract'> = {
    'expert': 'Full-time',
    'intermediate': 'Part-time',
    'entry': 'Contract',
  };

  return {
    id: String(project.id),
    title: project.title,
    company: 'MegiLance Client',
    location: 'Remote',
    type: typeMap[project.experience_level] || 'Contract',
    budget,
    description: project.description,
    featured: project.experience_level === 'expert',
    category: project.category,
    skills: Array.isArray(project.skills) ? project.skills : 
            typeof project.skills === 'string' ? project.skills.split(',').filter(Boolean) : [],
    created_at: project.created_at,
  };
};

const Jobs: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const themed = resolvedTheme === 'dark' ? dark : light;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');

  const headerRef = useRef<HTMLElement | null>(null);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const filtersVisible = useIntersectionObserver(filtersRef, { threshold: 0.1 });
  const gridVisible = useIntersectionObserver(gridRef, { threshold: 0.1 });

  // Fetch jobs from API
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: any = {
        status: 'open',
        limit: 50,
      };
      if (category) filters.category = category;
      
      const data: any = await api.search.projects(q, filters);
      
      const projects = Array.isArray(data) ? data : (data.items || []);
      setJobs(projects.map(projectToJob));
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Unable to load jobs. Please try again later.');
      // Fallback to empty array
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [q, category]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Client-side filtering for location and type
  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const locMatch = location ? j.location.toLowerCase().includes(location.toLowerCase()) : true;
      const typeMatch = type ? j.type === (type as Job['type']) : true;
      return locMatch && typeMatch;
    });
  }, [jobs, location, type]);

  // Handle search button click
  const handleSearch = () => {
    fetchJobs();
  };

  // Prevent flash during theme resolution
  if (!resolvedTheme) return null;

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <header
          ref={headerRef as React.RefObject<HTMLElement>}
          className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}
        >
          <span className={common.headerBadge}>🚀 Live Projects</span>
          <h1 className={common.headerTitle}>Explore Opportunities</h1>
          <p className={common.headerText}>Find investor-grade opportunities with transparent budgets and clear scopes.</p>
        </header>

        <div
          ref={filtersRef}
          className={cn(common.filters, themed.filters, filtersVisible ? common.isVisible : common.isNotVisible)}
          role="search"
          aria-label="Job search filters"
        >
          <div className={common.filterGroup}>
            <label className={cn(common.label, themed.label)} htmlFor="job-q">Search</label>
            <input
              id="job-q"
              className={cn(common.input, themed.input)}
              type="search"
              placeholder="Role, skill, or keyword"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search jobs by keyword"
            />
          </div>

          <div className={common.filterGroup}>
            <label className={cn(common.label, themed.label)} htmlFor="job-category">Category</label>
            <select
              id="job-category"
              className={cn(common.select, themed.select)}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              <option value="development">Development</option>
              <option value="design">Design</option>
              <option value="marketing">Marketing</option>
              <option value="writing">Writing</option>
              <option value="data">Data & Analytics</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className={common.filterGroup}>
            <label className={cn(common.label, themed.label)} htmlFor="job-type">Type</label>
            <select
              id="job-type"
              className={cn(common.select, themed.select)}
              value={type}
              onChange={(e) => setType(e.target.value)}
              aria-label="Filter by job type"
            >
              <option value="">Any</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
            </select>
          </div>

          <button 
            className={cn(common.searchButton, themed.searchButton)} 
            type="button" 
            aria-label="Apply filters"
            onClick={handleSearch}
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
            <p>Finding the best opportunities...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className={cn(common.errorContainer, themed.errorContainer)} role="alert">
            <span className={common.errorIcon}>⚠️</span>
            <p>{error}</p>
            <button className={cn(common.retryButton, themed.retryButton)} onClick={handleSearch}>
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <>
            <div className={cn(common.resultsHeader, themed.resultsHeader)}>
              <span className={common.resultsCount}>{filtered.length} project{filtered.length !== 1 ? 's' : ''} found</span>
            </div>

            <div
              ref={gridRef}
              className={cn(common.grid, gridVisible ? common.isVisible : common.isNotVisible)}
              role="list"
              aria-label="Job results"
            >
              {filtered.map((job, index) => (
                <article 
                  key={job.id} 
                  className={cn(common.card, themed.card, job.featured && common.cardFeatured, job.featured && themed.cardFeatured)} 
                  role="listitem" 
                  aria-labelledby={`job-${job.id}-title`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {job.featured && (
                    <div className={cn(common.featuredRibbon, themed.featuredRibbon)}>
                      <span>⭐ Featured</span>
                    </div>
                  )}
                  <div className={common.cardHeader}>
                    <h3 id={`job-${job.id}-title`} className={cn(common.cardTitle, themed.cardTitle)}>{job.title}</h3>
                    {job.category && (
                      <span className={cn(common.cardCategory, themed.cardCategory)}>{job.category}</span>
                    )}
                  </div>
                  <div className={cn(common.cardMeta, themed.cardMeta)}>
                    <span className={common.metaItem}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={common.metaIcon}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      {job.company}
                    </span>
                    <span className={common.metaItem}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={common.metaIcon}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      {job.location}
                    </span>
                    <span className={common.metaItem}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={common.metaIcon}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {job.type}
                    </span>
                  </div>
                  <div className={cn(common.cardBudget, themed.cardBudget)}>
                    <span className={common.budgetLabel}>Budget</span>
                    <span className={common.budgetValue}>{job.budget}</span>
                  </div>
                  <p className={cn(common.cardDesc, themed.cardDesc)}>{job.description}</p>
                  
                  {job.skills && job.skills.length > 0 && (
                    <div className={common.skillsContainer}>
                      {job.skills.slice(0, 4).map((skill, i) => (
                        <span key={i} className={cn(common.skillTag, themed.skillTag)}>{skill}</span>
                      ))}
                      {job.skills.length > 4 && (
                        <span className={cn(common.skillTag, common.skillMore, themed.skillMore)}>+{job.skills.length - 4}</span>
                      )}
                    </div>
                  )}

                  <div className={common.cardFooter}>
                    <button 
                      className={cn(common.cardButton, themed.cardButton)} 
                      onClick={() => router.push(`/jobs/${job.id}`)} 
                      aria-label={`View details for ${job.title}`}
                    >
                      View Details
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={common.buttonIcon}>
                        <path d="M5 12h14m-7-7 7 7-7 7"/>
                      </svg>
                    </button>
                    <button 
                      className={cn(common.cardButton, common.cardButtonSecondary, themed.cardButtonSecondary)} 
                      aria-label={`Save ${job.title}`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={common.buttonIcon}>
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                      </svg>
                      Save
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className={cn(common.emptyState, themed.emptyState)} role="status" aria-live="polite">
                <span className={common.emptyIcon}>🔍</span>
                <h3>No projects found</h3>
                <p>Try adjusting your filters or search terms to find more opportunities.</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default Jobs;
