// @AI-HINT: Portal Search page. Theme-aware, accessible, animated with filters and results list.
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { useToaster } from '@/app/components/Toast/ToasterProvider';
import common from './Search.common.module.css';
import light from './Search.light.module.css';
import dark from './Search.dark.module.css';

type ResultType = 'Message' | 'Project' | 'User' | 'Invoice';

type Result = {
  id: string;
  title: string;
  snippet: string;
  type: ResultType;
  date: string;
};

const TYPES = ['All', 'Project', 'User'] as const;
const DATES = ['Any time', 'Past week', 'Past month', 'Past year'] as const;

const Search: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { notify } = useToaster();

  const [query, setQuery] = useState('');
  const [type, setType] = useState<(typeof TYPES)[number]>('All');
  const [date, setDate] = useState<(typeof DATES)[number]>('Any time');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  const headerRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const resultsVisible = useIntersectionObserver(resultsRef, { threshold: 0.1 });

  const searchAPI = useCallback(async (searchQuery: string, searchType: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const allResults: Result[] = [];

    try {
      // Search projects if type is All or Project
      if (searchType === 'All' || searchType === 'Project') {
        const projectRes = await fetch(`/backend/api/search/projects?q=${encodeURIComponent(searchQuery)}&limit=10`);
        if (projectRes.ok) {
          const projects = await projectRes.json();
          allResults.push(...projects.map((p: any) => ({
            id: `project-${p.id}`,
            title: p.title,
            snippet: p.description?.substring(0, 100) + '...' || 'No description',
            type: 'Project' as ResultType,
            date: p.created_at || new Date().toISOString(),
          })));
        }
      }

      // Search freelancers if type is All or User
      if (searchType === 'All' || searchType === 'User') {
        const userRes = await fetch(`/backend/api/search/freelancers?q=${encodeURIComponent(searchQuery)}&limit=10`);
        if (userRes.ok) {
          const users = await userRes.json();
          allResults.push(...users.map((u: any) => ({
            id: `user-${u.id}`,
            title: u.full_name || 'Unknown User',
            snippet: u.bio?.substring(0, 100) || u.skills?.join(', ') || 'Freelancer',
            type: 'User' as ResultType,
            date: u.created_at || new Date().toISOString(),
          })));
        }
      }

      setResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
      notify({ title: 'Search Error', description: 'Failed to fetch results. Please try again.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAPI(query, type);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, type, searchAPI]);

  // Filter results by date
  const filteredResults = useMemo(() => {
    const dayMs = 24 * 60 * 60 * 1000;
    const withinDate = (d: string) => {
      if (date === 'Any time') return true;
      const now = new Date();
      const dt = new Date(d);
      const diff = now.getTime() - dt.getTime();
      if (date === 'Past week') return diff <= 7 * dayMs;
      if (date === 'Past month') return diff <= 31 * dayMs;
      if (date === 'Past year') return diff <= 365 * dayMs;
      return true;
    };
    return results.filter((r) => withinDate(r.date));
  }, [results, date]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <div ref={headerRef} className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}>
          <h1 className={common.title}>Search</h1>
          <p className={common.subtitle}>Find projects and freelancers across the platform.</p>
        </div>

        <div className={cn(common.controls)} role="search" aria-label="Global search controls">
          <label className={common.srOnly} htmlFor="q">Query</label>
          <input
            id="q"
            className={common.input}
            type="search"
            placeholder="Search projects and freelancers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <label className={common.srOnly} htmlFor="type">Type</label>
          <select id="type" className={common.select} value={type} onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <label className={common.srOnly} htmlFor="date">Date</label>
          <select id="date" className={common.select} value={date} onChange={(e) => setDate(e.target.value as (typeof DATES)[number])}>
            {DATES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div className={common.loadingState}>
            <div className={common.spinner}></div>
            <p>Searching...</p>
          </div>
        )}

        {!loading && query.trim() && (
          <div ref={resultsRef} className={cn(common.results, resultsVisible ? common.isVisible : common.isNotVisible)} role="list" aria-label="Search results">
            {filteredResults.map((r) => (
              <article key={r.id} role="listitem" className={common.card} aria-labelledby={`res-${r.id}-title`}>
                <h3 id={`res-${r.id}-title`} className={common.cardTitle}>{r.title}</h3>
                <div className={common.cardMeta}>
                  <span className={cn(common.typeBadge, r.type === 'Project' ? common.typeProject : common.typeUser)}>
                    {r.type}
                  </span>
                  <span>{formatDate(r.date)}</span>
                </div>
                <p>{r.snippet}</p>
              </article>
            ))}
          </div>
        )}

        {!loading && query.trim() && filteredResults.length === 0 && (
          <EmptyState
            title="No results found"
            description="Try a different query or adjust filters to broaden your search."
            action={
              <button
                type="button"
                className={common.select}
                onClick={() => notify({ title: 'Tip', description: 'Use broader keywords or select All types.', variant: 'info', duration: 2500 })}
              >
                Get Search Tips
              </button>
            }
          />
        )}

        {!loading && !query.trim() && (
          <EmptyState
            title="Start Searching"
            description="Enter keywords to find projects, freelancers, and more."
          />
        )}
      </div>
    </main>
  );
};

export default Search;
