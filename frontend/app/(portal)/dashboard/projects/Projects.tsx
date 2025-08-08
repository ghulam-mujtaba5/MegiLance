// @AI-HINT: Portal Projects page. Theme-aware, accessible, animated grid of project cards with filters.
'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import common from './Projects.common.module.css';
import light from './Projects.light.module.css';
import dark from './Projects.dark.module.css';

interface Project {
  id: string;
  title: string;
  client: string;
  status: 'In Progress' | 'Review' | 'Completed' | 'Overdue';
  progress: number;
  budget: string;
}

const MOCK_PROJECTS: Project[] = [
  { id: 'p1', title: 'E-commerce Redesign', client: 'Shopify Masters', status: 'In Progress', progress: 64, budget: '$25,000' },
  { id: 'p2', title: 'Mobile App (iOS/Android)', client: 'Appify Solutions', status: 'Review', progress: 92, budget: '$30,000' },
  { id: 'p3', title: 'Analytics Dashboard', client: 'DataDriven Co.', status: 'Completed', progress: 100, budget: '$18,500' },
  { id: 'p4', title: 'Marketing Landing Pages', client: 'Innovate Inc.', status: 'Overdue', progress: 58, budget: '$8,500' },
  { id: 'p5', title: 'Design System Tokens', client: 'Figma Pros', status: 'In Progress', progress: 41, budget: '$12,000' },
  { id: 'p6', title: 'Realtime Chat Module', client: 'CommsHub', status: 'In Progress', progress: 73, budget: '$16,200' },
];

const STATUSES = ['All', 'In Progress', 'Review', 'Completed', 'Overdue'] as const;

const Projects: React.FC = () => {
  const { theme } = useTheme();
  const themed = theme === 'dark' ? dark : light;

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('All');

  const headerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const gridVisible = useIntersectionObserver(gridRef, { threshold: 0.1 });

  const projects = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = MOCK_PROJECTS.filter(p =>
      (status === 'All' || p.status === status) &&
      (!q || p.title.toLowerCase().includes(q) || p.client.toLowerCase().includes(q))
    );
    return filtered;
  }, [query, status]);

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <div ref={headerRef} className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}>
          <div>
            <h1 className={common.title}>Projects</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Track progress, budgets, and status across all projects.</p>
          </div>
          <div className={common.controls} aria-label="Project filters">
            <label className={common.srOnly} htmlFor="project-q">Search projects</label>
            <input id="project-q" className={cn(common.input, themed.input)} type="search" placeholder="Search projects…" value={query} onChange={(e) => setQuery(e.target.value)} />

            <label className={common.srOnly} htmlFor="project-status">Status</label>
            <select id="project-status" className={cn(common.select, themed.select)} value={status} onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <button type="button" className={cn(common.button, themed.button)} aria-label="Create project">New Project</button>
          </div>
        </div>

        <div ref={gridRef} className={cn(common.grid, gridVisible ? common.isVisible : common.isNotVisible)}>
          {projects.map(p => (
            <article key={p.id} tabIndex={0} aria-labelledby={`proj-${p.id}-title`} className={cn(common.card)}>
              <h3 id={`proj-${p.id}-title`} className={common.cardTitle}>{p.title}</h3>
              <div className={common.meta}>
                <span>{p.client}</span>
                <span>{p.status}</span>
                <span>{p.budget}</span>
              </div>
              <div className={cn(common.progressWrap, themed.progressWrap)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.progress} aria-label={`Progress ${p.progress}%`}>
                {/* SVG progress to avoid inline styles */}
                <svg width="100%" height="8" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
                  <rect x="0" y="0" width="100" height="8" rx="4" ry="4" fill="transparent" />
                  <rect x="0" y="0" width={p.progress} height="8" rx="4" ry="4" className={cn(common.progressBar, themed.progressBar)} />
                </svg>
              </div>
              <div className={common.chips}>
                <span className={cn(common.chip, themed.chip)}>Design</span>
                <span className={cn(common.chip, themed.chip)}>Frontend</span>
              </div>
              <div className={common.actions}>
                <button className={cn(common.button, themed.button)} aria-label={`Open ${p.title}`}>Open</button>
                <button className={cn(common.button, themed.button, 'secondary')} aria-label={`Archive ${p.title}`}>Archive</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Projects;
